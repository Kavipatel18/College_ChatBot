import json
import codecs


with open('./data/data1.json', encoding='utf-8', errors='replace') as file:
    data = json.load(file)


unique_intents = {}

# Get the minimum length between intent and question arrays
min_length = min(len(data["intent"]), len(data["question"]))

# Function to decode unicode-escaped characters
def decode_unicode(text):
    return codecs.decode(text, 'unicode_escape')

# Loop through intents and create unique ones based on questions
for i in range(min_length):
    intent = decode_unicode(data["intent"][i])
    question = decode_unicode(data["question"][i])
    
    # Remove spaces and special characters from the question to create a unique identifier
    question_based_intent = intent + "_" + "_".join(question.split()).lower()
    
    # Ensure no duplicate intents
    if question_based_intent not in unique_intents:
        unique_intents[question_based_intent] = 1
    else:
        # If duplicate, add a numeric suffix
        unique_intents[question_based_intent] += 1
        question_based_intent = f"{question_based_intent}_{unique_intents[question_based_intent]}"
    
    # Update the intent in the JSON data
    data["intent"][i] = question_based_intent

# Save the updated JSON with unique intents
output_file_path = "./data/intents.json"  # Path for the output file
with open(output_file_path, "w") as output_file:
    json.dump(data, output_file, indent=4)

print(f"Updated JSON saved to {output_file_path}")