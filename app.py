from flask import Flask, request, jsonify
import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask_cors import CORS
import json
from spellchecker import SpellChecker
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

db_config = {
    'host': '127.0.0.1',
    'username': 'root',
    'port':'port number',
    'password': 'write you password',
    'database': 'write your database'
}

try:
    connection = mysql.connector.connect(**db_config)
    print("Database connection successful")
except mysql.connector.Error as err:
    print(f"Database connection failed: {err}")
    # Handle the error appropriately

# Load data and create DataFrame
try:
    with open('./data/data2.json', 'r') as f:
        data = json.load(f)
    print("Data loaded successfully.")
    df = pd.DataFrame({
        'intent': data['intent'],
        'question': data['question'],
        'response': data['response']
    })
    print("DataFrame created successfully.")
except Exception as e:
    print(f"Error loading data: {e}")
    exit()

spell = SpellChecker()

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'\b\w{1,2}\b', '', text)
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d+', '', text)
    return text

df['question'] = df['question'].apply(preprocess_text)
print("Preprocessing completed.")

X = df['question']
y = df['intent']
responses = df['response']

vectorizer = TfidfVectorizer()
X_vectors = vectorizer.fit_transform(X)

def normalize_response(response):
    return response.lower().strip()

def hash_response(response):
    import hashlib
    return hashlib.md5(normalize_response(response).encode()).hexdigest()

def chatbot_response(user_input, top_n=3, spell_corrected=False):
    try:
        user_input = preprocess_text(user_input)
        user_input_vector = vectorizer.transform([user_input])
        similarities = cosine_similarity(user_input_vector, X_vectors).flatten()
        # print(similarities.argsort()[-20:][::-1])

        top_n_indices = similarities.argsort()[-top_n:][::-1]
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
                    high_confidence_responses.append({"response": response, "similarity": float(similarity),"intent":intent})
                elif 0.4 <= similarity < 0.8:
                    medium_confidence_responses.append({"response": response, "similarity": float(similarity),"intent":intent})

        if high_confidence_responses:
            return high_confidence_responses
        elif medium_confidence_responses:
            return medium_confidence_responses

        if not spell_corrected:
            corrected_input = ' '.join(spell.correction(word) or word for word in user_input.split())
            if user_input != corrected_input:
                return chatbot_response(corrected_input, top_n=top_n, spell_corrected=True)

        return [{"response": "I'm sorry, but I couldn't find a relevant answer to your question. Could you please rephrase or ask something else?", "similarity": 0.0}]

    except Exception as e:
        print(f"Error: {e}")
        return [{"response": "An error occurred while processing your query. Please try again later.", "similarity": 0.0}]
    
def store_user_question(email, question, answer, intent):
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        # Check the number of entries for the user
        cursor.execute("SELECT COUNT(*) FROM user_questions WHERE email = %s", (email,))
        count = cursor.fetchone()[0]

        if count >= 5:
            # Delete the oldest entry
            cursor.execute("DELETE FROM user_questions WHERE email = %s ORDER BY timestamp ASC LIMIT 1", (email,))

        # Insert the new question
        query = """INSERT INTO user_questions (email, question, answer, intent) 
                   VALUES (%s, %s, %s, %s)"""
        cursor.execute(query, (email, question, answer, intent))

        connection.commit()
        print("User question stored successfully")
    except Error as e:
        print(f"Error storing user question: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/chatbot', methods=['POST'])
def get_response():
    data = request.json
    user_input = data.get('user_input', '')
    email = data.get('email', '')  # Get the email from the request
    top_n = data.get('top_n', 3)
    responses = chatbot_response(user_input, top_n=top_n)
    
    if responses:
        # Store the question and the best response
        best_response = responses[0]
        store_user_question(email, user_input, best_response['response'], best_response.get('intent', 'unknown'))
    
    return jsonify({"responses": responses})

import traceback

@app.route('/store_user', methods=['POST'])
def store_user():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    picture = data.get('picture')
    message_count = data.get('message_count')

    print(f"Received data: name={name}, email={email}, picture={picture}, message count={message_count}")

    connection = None
    try:
        connection = mysql.connector.connect(**db_config)
        print("Database connection established")
        cursor = connection.cursor()
        query = """INSERT INTO user_information (username, email, picture_url, message_count) 
                   VALUES (%s, %s, %s, %s) 
                   ON DUPLICATE KEY UPDATE username = %s, picture_url = %s"""
        cursor.execute(query, (name, email, picture,message_count, name, picture))
        connection.commit()
        print("Query executed successfully")
        return jsonify({"success": True, "message": "User data stored successfully"})
    except Error as e:
        print(f"Database error: {e}")
        print(traceback.format_exc())
        return jsonify({"success": False, "message": "Error storing user data"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        print(traceback.format_exc())
        return jsonify({"success": False, "message": "Unexpected error occurred"}), 500
    finally:
        if connection is not None and connection.is_connected():
            cursor.close()
            connection.close()
            print("Database connection closed")

@app.route('/check_login', methods=['POST'])
def check_login():
    email = request.args.get('email')
    if not email:
        return jsonify({"isLoggedIn": False})

    connection = None
    try:
        connection = mysql.connector.connect(**db_config)
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
    except Error as e:
        print(f"Error: {e}")
        return jsonify({"isLoggedIn": False, "error": "Database error"}), 500
    finally:
        if connection is not None and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/logout', methods=['POST'])
def logout():
    # For this implementation, we don't need to do anything on the server side for logout
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route('/update_message_count', methods=['POST'])
def update_message_count():
    data = request.json
    email = data.get('email')
    message_count = data.get('message_count')

    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()
        query = "UPDATE user_information SET message_count = %s WHERE email = %s"
        cursor.execute(query, (message_count, email))
        connection.commit()
        return jsonify({"success": True, "message": "Message count updated successfully"})
    except Error as e:
        print(f"Error: {e}")
        return jsonify({"success": False, "message": "Error updating message count"}), 500
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True)
    CORS(app)