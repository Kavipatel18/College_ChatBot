from flask import Flask, request, jsonify
import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask_cors import CORS
import json
from spellchecker import SpellChecker

app = Flask(__name__)
CORS(app)

# Load data from JSON file
try:
    with open('./data/modified_unique_intents.json', 'r') as f:
        data = json.load(f)
    print("Data loaded successfully.")
except Exception as e:
    print(f"Error loading JSON file: {e}")
    exit()

# Convert to DataFrame
try:
    df = pd.DataFrame({
        'intent': data['intent'],
        'question': data['question'],
        'response': data['response']
    })
    print("DataFrame created successfully.")
    print(df.head())  # Print to verify data
except KeyError as e:
    print(f"Error creating DataFrame: Missing key {e}")
    exit()

# Initialize SpellChecker
spell = SpellChecker()

# Text Preprocessing
def preprocess_text(text):
    text = text.lower()  # Convert to lowercase
    text = re.sub(r'\b\w{1,2}\b', '', text)  # Remove short words
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = re.sub(r'\d+', '', text)  # Remove numbers
    # Correct spelling for each word
    text = ' '.join(spell.correction(word) or word for word in text.split())
    return text

# Apply preprocessing to questions in the DataFrame
df['question'] = df['question'].apply(preprocess_text)
print("Preprocessing completed.")

# Feature Extraction
X = df['question']
y = df['intent']
responses = df['response']

vectorizer = TfidfVectorizer()
X_vectors = vectorizer.fit_transform(X)

import hashlib

def normalize_response(response):
    """ Normalize the response text for uniqueness checking. """
    response = response.lower().strip()  # Convert to lowercase and strip extra spaces
    return response

def hash_response(response):
    """ Create a hash of the normalized response for uniqueness checking. """
    return hashlib.md5(normalize_response(response).encode()).hexdigest()

def chatbot_response(user_input, top_n=3):
    try:
        user_input = preprocess_text(user_input)
        print(f"Preprocessed input: {user_input}")  # Debugging log

        user_input_vector = vectorizer.transform([user_input])
        similarities = cosine_similarity(user_input_vector, X_vectors).flatten()
        print(f"Similarities: {similarities}")  # Debugging log

        top_n_indices = similarities.argsort()[-top_n:][::-1]  # Get top N most similar questions
        top_n_similarities = similarities[top_n_indices]
        print(f"Top N similarities: {top_n_similarities}")  # Debugging log

        # Use a set to track unique response hashes
        unique_response_hashes = set()
        responses_list = []

        for idx, similarity in zip(top_n_indices, top_n_similarities):
            if similarity >= 0.4:  # Only consider responses with similarity >= 0.4
                intent = y[idx]
                response = responses[df['intent'] == intent].values[0]
                response_hash = hash_response(response)
                if response_hash not in unique_response_hashes:
                    unique_response_hashes.add(response_hash)
                    responses_list.append({"response": response, "similarity": similarity})
        
        if not responses_list:
            return [{"response": "Your query is not appropriate. Please contact BVM through principal@bvmengineering.ac.in."}]
        
        return responses_list
    
    except Exception as e:
        print(f"Error: {e}")
        return [{"response": "An error occurred while processing your query."}]



@app.route('/chatbot', methods=['POST'])
def get_response():
    data = request.json
    user_input = data.get('user_input', '')
    top_n = data.get('top_n', 3)  # Number of closest responses, defaults to 3 if not provided
    responses = chatbot_response(user_input, top_n=top_n)
    return jsonify({"responses": responses})

if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True)
