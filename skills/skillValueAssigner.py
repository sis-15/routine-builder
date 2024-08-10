import re
import json
from pathlib import Path

# The code of points follows a grid pattern. A skills can be defined with the function y = 6x + 1, y = 6x + 2 for B skills, and so on.
# F/G/H/I skills are more complicated and exist in the same column

# Function to assign letter value based on the skill number
def get_letter_value(number):
    remainder = number % 6
    if remainder == 1:
        return 'A'
    elif remainder == 2:
        return 'B'
    elif remainder == 3:
        return 'C'
    elif remainder == 4:
        return 'D'
    elif remainder == 5:
        return 'E'
    else:
        return 'To be assigned'  # Placeholder for multiples of 6

# Function to parse the text file and create a JSON structure
def parse_skills_file(file_path):
    skills = []
    with file_path.open('r', encoding='utf-8') as file:
        for line in file:
            match = re.match(r'(\d+)\.\s*(.*)', line)
            if match:
                number = int(match.group(1))
                description = match.group(2)
                letter_value = get_letter_value(number)
                skills.append({
                    'number': number,
                    'description': description,
                    'value': letter_value
                })
    return skills

# Main function to process all text files and save them as JSON
def process_files(file_list):
    for txt_file in file_list:
        file_path = Path(txt_file)
        if file_path.exists() and file_path.is_file():
            skills = parse_skills_file(file_path)
            json_filename = file_path.with_suffix('.json')
            with json_filename.open('w', encoding='utf-8') as json_file:
                json.dump(skills, json_file, indent=2)
            print(f'Successfully created {json_filename}')
        else:
            print(f'File {txt_file} does not exist or is not a valid file.')

if __name__ == '__main__':
    # List of text files to process
    # Skipping vault since values vary
    file_list = ['fx.txt', 'pb.txt', 'ph.txt', 'sr.txt', 'hb.txt']
    
    # Process each file and create corresponding JSON files
    process_files(file_list)
