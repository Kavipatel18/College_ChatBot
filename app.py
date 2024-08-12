from flask import Flask, request, jsonify
import pandas as pd
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from flask_cors import CORS


app = Flask(__name__)
CORS(app)
# Data and Model Initialization
data = {
    "intent": [
        "get_location", "get_overview", "get_overview", "get_academic_programs", "get_academic_programs",
        "get_academic_achievements", "get_academic_achievements", "get_faculty_achievements", "get_faculty_achievements",
        "get_student_achievements", "get_student_achievements", "get_campus_facilities", "get_campus_facilities",
        "get_research_and_development", "get_research_and_development", "get_student_support", "get_student_support",
        "get_contact_information", "get_contact_information", "get_institution_name", "get_affiliated_ans",
        "get_mission", "get_vision", "get_undergraduate_information", "get_seats_civil_available", "get_seats_electro_available",
        "get_seats_mech_available", "get_seats_electr_available", "get_seats_compu_available", "get_seats_prod_available",
        "get_seats_info_available", "get_seats_it_available", "get_seats_ec_available", "get_seats_pddc_available",
        "get_postgraduate_information", "get_mtech_seats_struc_available", "get_mtech_seats_comp_available",
        "get_mtech_seats_constru_available", "get_mtech_seats_environ_available", "get_mtech_seats_ml_available",
        "get_mtech_seats_transport_available", "get_mtech_seats_power_available", "get_mtech_seats_Infra_available",
        "get_accreditation_information"
    ],
    "example": [
        "Where is BVM?", "Tell me about the institution.", "What is BVM?", "What undergraduate programs are offered?",
        "Tell me about the postgraduate programs.", "What are the academic achievements of BVM?", "Tell me about the exam reforms.",
        "What are the faculty achievements?", "Tell me about the research publications by faculty.", "What are the student achievements?",
        "Tell me about the student competitions.", "What facilities are available on campus?", "Tell me about the campus size and features.",
        "What research initiatives does BVM have?", "Tell me about the consultancy services.", "What student support services are available?",
        "Tell me about the extracurricular activities.", "How can I contact BVM?", "What is the website of BVM?",
        "What is the name of the institution?", "Which university is BVM affiliated with?", "What is the mission of BVM?",
        "What is the vision of BVM?", "What undergraduate programs are offered at BVM?", "How many seats are available for Civil Engineering in at BVM?",
        "How many seats are available for Electronics Engineering at BVM?", "How many seats are available for Mechanical Engineering at BVM?",
        "How many seats are available for Electrical Engineering at BVM?", "How many seats are available for Computer Engineering at BVM?",
        "How many seats are available for Production Engineering at BVM?", "How many seats are available for Information Technology Engineering at BVM?",
        "How many seats are available for IT at BVM?", "How many seats are available for Electronics And Communication at BVM?",
        "How many seats are available for PDDC Mechnical at BVM?", "What are the postgraduate programs offered at BVM?",
        "How many seats are available for Structural Engineering in Mtech at BVM?", "How many seats are available for Computer Engineering in Mtech at BVM?",
        "How many seats are available for Construction Engineering and Management in Mtech at BVM?", "How many seats are available for Environmental Engineering in Mtech at BVM?",
        "How many seats are available for Machine Learning in Mtech at BVM?", "How many seats are available for Transportation System Engineering in Mtech at BVM?",
        "How many seats are available for Power System in Mtech at BVM?", "How many seats are available for Infrastructure Engineering and Technology in Mtech at BVM?",
        "What is the accreditation status of BVM?"
    ],
    "response": [
        "Birla Vishvakarma Mahavidyalaya (BVM) is located at Mota Bazaar, Vallabh Vidyanagar, Anand, Gujarat 388120.",
        "Birla Vishvakarma Mahavidyalaya (BVM) is affiliated with Gujarat Technological University. The mission is to re-engineer curricula, promote innovative practices, imbibe core values, and develop faculty and staff. The vision is to produce globally employable innovative engineers with core values.",
        "Birla Vishvakarma Mahavidyalaya (BVM) is affiliated with Gujarat Technological University.",
        "BVM offers various undergraduate programs including Civil Engineering, Mechanical Engineering, Electronics Engineering, and more. Postgraduate programs include M.Tech in Structural Engineering, M.Tech in Computer Engineering, and others.",
        "BVM offers various undergraduate programs including Civil Engineering, Mechanical Engineering, and more.",
        "BVM has implemented outcome-based education, developed a custom ERP system to streamline academic processes, and incorporated Bloom's Taxonomy in exam reforms to ensure effective assessment of course outcomes.",
        "BVM has implemented outcome-based education and developed a custom ERP system.",
        "Faculty at BVM have published numerous papers in international and national journals and have received awards such as 'Best Researcher of the Year' and 'Innovative Teaching Award'.",
        "Faculty at BVM have published numerous papers in international and national journals.",
        "Students at BVM have won competitions like the Smart India Hackathon and achieved a placement percentage of 90% with the highest package of 18 LPA in 2022.",
        "Students at BVM have won competitions like the Smart India Hackathon.",
        "The campus spans 18.96 acres with state-of-the-art facilities, including laboratories, digital classrooms, an auditorium, and a library.",
        "The campus spans 18.96 acres with state-of-the-art facilities.",
        "BVM has several research initiatives including sponsored projects and collaborations with industry. The institute also provides consultancy services to industries and government organizations.",
        "BVM has several research initiatives and provides consultancy services to industries.",
        "BVM offers a range of extracurricular activities, an active Training & Placement Cell, and counseling services for students.",
        "BVM offers a range of extracurricular activities and an active Training & Placement Cell.",
        "You can contact BVM through their website at www.bvmengineering.ac.in. The address is BVM Engineering College, Vallabh Vidyanagar, Anand, Gujarat, India.",
        "You can contact BVM through their website at www.bvmengineering.ac.in.",
        "The name of the institution is Birla Vishvakarma Mahavidyalaya (BVM).",
        "BVM is affiliated with Gujarat Technological University.",
        "The mission of BVM is to re-engineer curricula, promote innovative practices, imbibe core values, reform policies, develop faculty and staff.",
        "The vision of BVM is to produce globally employable innovative engineers with core values.",
        "BVM offers undergraduate programs in Civil Engineering, Mechanical Engineering, Electronics Engineering, Electrical Engineering, Computer Engineering, Production Engineering, Information Technology, Electronics & Communication, and P.D.D.C (Mechanical) – Part Time.",
        "There are 120 seats available for Civil Engineering in UG at BVM.",
        "There are 75 seats available for Electronics Engineering in UG at BVM.",
        "There are 120 seats available for Mechanical Engineering in UG at BVM.",
        "There are 60 seats available for Electrical Engineering in UG at BVM.",
        "There are 60 seats available for Computer Engineering in UG at BVM.",
        "There are 30 seats available for Production Engineering in UG at BVM.",
        "There are 60 seats available for Information Technology Engineering in UG at BVM.",
        "There are 60 seats available for IT Engineering in UG at BVM.",
        "There are 60 seats available for Electronics And Communication Engineering in UG at BVM.",
        "There are 30 seats available for PDDC Mechnical Engineering in UG at BVM.",
        "BVM offers postgraduate programs including M.Tech in Structural Engineering, M.Tech in Computer Engineering, M.Tech in Construction Engineering & Management, M.Tech in Environmental Engineering, M.Tech in Machine Design, M.Tech in Transportation System Engineering, M.Tech in Power System, and M.Tech in Infrastructure Engineering & Technology.",
        "There are 18 seats available for M.Tech in Structural Engineering at BVM.",
        "There are 25 seats available for M.Tech in Computer Engineering at BVM.",
        "There are 18 seats available for M.Tech in Construction Engineering and Management Engineering at BVM.",
        "There are 18 seats available for M.Tech in Environmental Engineering at BVM.",
        "There are 18 seats available for M.Tech in Machine Learning Engineering at BVM.",
        "There are 18 seats available for M.Tech in Transportation System Engineering at BVM.",
        "There are 18 seats available for M.Tech in Power System at BVM.",
        "There are 18 seats available for M.Tech in Infrastructure Engineering and Technology at BVM.",
        "BVM has NBA accreditation for 4 undergraduate programs."
    ]
}

df = pd.DataFrame(data)

# Text Preprocessing
def preprocess_text(text):
    text = text.lower()  # Convert to lowercase
    text = re.sub(r'\b\w{1,2}\b', '', text)  # Remove short words
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    text = re.sub(r'\d+', '', text)  # Remove numbers
    return text

df['example'] = df['example'].apply(preprocess_text)

# Feature Extraction
X = df['example']
y = df['intent']

vectorizer = TfidfVectorizer()
X_vectors = vectorizer.fit_transform(X)

# Chatbot Response
def chatbot_response(user_input):
    user_input = preprocess_text(user_input)
    user_input_vector = vectorizer.transform([user_input])
    
    similarities = cosine_similarity(user_input_vector, X_vectors).flatten()
    best_match_index = np.argmax(similarities)
    best_match_similarity = similarities[best_match_index]
    
    if best_match_similarity >= 0.4:
        intent = y[best_match_index]
        response = df[df['intent'] == intent]['response'].values[0]
    else:
        response = "Your query is not appropriate. Please contact BVM through abc@gmail.com."
    
    return response

@app.route('/chatbot', methods=['POST'])
def get_response():
    data = request.json
    user_input = data.get('user_input', '')
    response = chatbot_response(user_input)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
