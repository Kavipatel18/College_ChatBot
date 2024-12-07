from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask_caching import Cache
import pandas as pd
import numpy as np
import re
import json
import hashlib
import traceback

# Machine Learning and NLP Libraries
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from spellchecker import SpellChecker
from fuzzywuzzy import fuzz

# Database Libraries
import mysql.connector
from mysql.connector.pooling import MySQLConnectionPool

# Additional Utilities
import joblib

# Flask Application Setup
app = Flask(__name__)
CORS(app)

# Cache Configuration
cache = Cache(app, config={
    'CACHE_TYPE': 'SimpleCache',  
    'CACHE_DEFAULT_TIMEOUT': 300  # 5 minutes cache timeout
})

# Database Configuration with Connection Pooling
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'college_chatbot',
    'pool_name': "chatbot_pool",
    'pool_size': 5
}

# Create Connection Pool
try:
    connection_pool = MySQLConnectionPool(**DB_CONFIG)
    print("Connection pool created successfully")
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    exit(1)

# Load and Preprocess Data
def load_data():
    try:
        with open('./data/data2.json', 'r') as f:
            data = json.load(f)
        
        df = pd.DataFrame({
            'intent': data['intent'],
            'question': data['question'],
            'response': data['response']
        })
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'\b\w{1,2}\b', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d+', '', text)
    return text

# Initialize Spell Checker and Vectorizer
spell = SpellChecker()
df = load_data()

if df is None:
    print("Failed to load data. Exiting.")
    exit(1)

df['question'] = df['question'].apply(preprocess_text)

# Vectorization
vectorizer = TfidfVectorizer()
X = df['question']
y = df['intent']
responses = df['response']
X_vectors = vectorizer.fit_transform(X)

# Save Vectorizer (Optional but recommended)
joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')

def normalize_response(response):
    return response.lower().strip()

def hash_response(response):
    return hashlib.md5(normalize_response(response).encode()).hexdigest()

def get_db_connection():
    """Get a database connection from the pool"""
    try:
        return connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

def chatbot_response(user_input, top_n=3, spell_corrected=False):
    # Create a cache key
    cache_key = f"response_{user_input}_{top_n}"
    
    # Check cache first
    cached_response = cache.get(cache_key)
    if cached_response:
        return cached_response

    try:
        user_input = preprocess_text(user_input)
        user_input_vector = vectorizer.transform([user_input])
        
        # Compute similarities
        similarities = cosine_similarity(user_input_vector, X_vectors).flatten()

        # Get top N indices efficiently
        top_n_indices = np.argpartition(similarities, -top_n)[-top_n:]
        top_n_indices = top_n_indices[np.argsort(similarities[top_n_indices])[::-1]]
        top_n_similarities = similarities[top_n_indices]

        unique_response_hashes = set()
        high_confidence_responses = []
        medium_confidence_responses = []

        for idx, similarity in zip(top_n_indices, top_n_similarities):
            intent = y[idx]
            response = responses[df['intent'] == intent].values[0]
            response_hash = hash_response(response)

            if response_hash not in unique_response_hashes:
                unique_response_hashes.add(response_hash)

                if similarity >= 0.8:
                    high_confidence_responses.append({
                        "response": response, 
                        "similarity": float(similarity), 
                        "intent": intent
                    })
                elif 0.4 <= similarity < 0.8:
                    medium_confidence_responses.append({
                        "response": response, 
                        "similarity": float(similarity), 
                        "intent": intent
                    })

        result = high_confidence_responses or medium_confidence_responses

        if not result and not spell_corrected:
            corrected_input = ' '.join(spell.correction(word) or word for word in user_input.split())
            if user_input != corrected_input:
                result = chatbot_response(corrected_input, top_n=top_n, spell_corrected=True)

        result = result or [{
            "response": "I'm sorry, but I couldn't find a relevant answer to your question. Could you please rephrase or ask something else?", 
            "similarity": 0.0
        }]
        
        # Cache the result
        cache.set(cache_key, result)
        
        return result

    except Exception as e:
        print(f"Chatbot Response Error: {e}")
        return [{
            "response": "An error occurred while processing your query. Please try again later.", 
            "similarity": 0.0
        }]

def recommend_questions(user_inputs, top_n=5):
    # Create a cache key
    cache_key = f"recommendations_{hash(tuple(user_inputs))}_{top_n}"
    
    # Check cache first
    cached_recommendations = cache.get(cache_key)
    if cached_recommendations:
        return cached_recommendations

    input_vectors = vectorizer.transform([preprocess_text(inp) for inp in user_inputs])
    similarities = cosine_similarity(input_vectors, X_vectors).mean(axis=0)
    
    def vectorized_fuzzy_score(user_inputs, questions):
        return np.array([
            np.mean([fuzz.partial_ratio(inp, q) / 100 for inp in user_inputs])
            for q in questions
        ])
    
    fuzzy_scores = vectorized_fuzzy_score(user_inputs, df['question'].tolist())
    combined_scores = similarities * 0.7 + fuzzy_scores * 0.3
    
    recommended_indices = np.argpartition(combined_scores, -top_n)[-top_n:]
    recommended_indices = recommended_indices[np.argsort(combined_scores[recommended_indices])[::-1]]
    
    recommended_questions = [df['question'].iloc[i] for i in recommended_indices]
    
    # Cache recommendations
    cache.set(cache_key, recommended_questions)
    print(recommend_questions)
    
    return recommended_questions

def store_user_question(email, question, answer, intent):
    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check and limit stored questions
        cursor.execute("SELECT COUNT(*) as count FROM user_questions WHERE email = %s", (email,))
        count = cursor.fetchone()['count']

        if count >= 5:
            cursor.execute("DELETE FROM user_questions WHERE email = %s ORDER BY timestamp ASC LIMIT 1", (email,))

        query = """INSERT INTO user_questions (email, question, answer, intent) 
                   VALUES (%s, %s, %s, %s)"""
        cursor.execute(query, (email, question, answer, intent))

        connection.commit()
        
        # Fetch the most recent stored data
        cursor.execute("SELECT * FROM user_questions WHERE email = %s ORDER BY timestamp DESC LIMIT 1", (email,))
        stored_data = cursor.fetchone()
        
        return stored_data

    except mysql.connector.Error as e:
        print(f"Error storing user question: {e}")
        return None
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/chatbot', methods=['POST'])
@cross_origin()
def get_response():
    data = request.json
    user_input = data.get('user_input', '')
    email = data.get('email', '')
    top_n = data.get('top_n', 3)
    
    # Process responses
    responses = chatbot_response(user_input, top_n=top_n)
    
    stored_data = None
    if responses:
        best_response = responses[0]
        stored_data = store_user_question(email, user_input, best_response['response'], best_response.get('intent', 'unknown'))
    
    # Fetch previous questions
    connection = get_db_connection()
    previous_questions = []
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
        SELECT question 
        FROM user_questions 
        WHERE email = %s 
        ORDER BY timestamp DESC 
        LIMIT 5
        """
        cursor.execute(query, (email,))
        previous_questions = [row['question'] for row in cursor.fetchall()]
    except mysql.connector.Error as e:
        print(f"Error fetching previous questions: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
    
    # Get recommendations
    all_inputs = previous_questions + [user_input]
    recommendations = recommend_questions(all_inputs, top_n=5)
    print(recommendations)
    
    return jsonify({
        "responses": responses,
        "previous_questions": previous_questions,
        "recommendations": recommendations
    })

@app.route('/store_user', methods=['POST'])
def store_user():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    picture = data.get('picture')
    message_count = data.get('message_count')

    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        query = """INSERT INTO user_information (username, email, picture_url, message_count) 
                   VALUES (%s, %s, %s, %s) 
                   ON DUPLICATE KEY UPDATE username = %s, picture_url = %s"""
        cursor.execute(query, (name, email, picture, message_count, name, picture))
        connection.commit()
        return jsonify({"success": True, "message": "User data stored successfully"})
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return jsonify({"success": False, "message": "Error storing user data"}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/check_login', methods=['POST'])
def check_login():
    email = request.args.get('email')
    if not email:
        return jsonify({"isLoggedIn": False})

    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM user_information WHERE email = %s"
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        if user:
            return jsonify({
                "isLoggedIn": True,
                "name": user['username'],
                "email": user['email'],
                "picture": user['picture_url'],
                "message_count": user['message_count']
            })
        else:
            return jsonify({"isLoggedIn": False})
    except mysql.connector.Error as e:
        print(f"Login check error: {e}")
        return jsonify({"isLoggedIn": False, "error": "Database error"}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/logout', methods=['POST'])
def logout():
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route('/update_message_count', methods=['POST'])
def update_message_count():
    data = request.json
    email = data.get('email')
    message_count = data.get('message_count')

    connection = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        query = "UPDATE user_information SET message_count = %s WHERE email = %s"
        cursor.execute(query, (message_count, email))
        connection.commit()
        return jsonify({"success": True, "message": "Message count updated successfully"})
    except mysql.connector.Error as e:
        print(f"Message count update error: {e}")
        return jsonify({"success": False, "message": "Error updating message count"}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True)