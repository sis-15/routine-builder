import json
from pathlib import Path

# Define the boundaries for each element group by event
element_group_boundaries = {
    'fx.json': [110, 48, 72, 36],  # Floor exercise
    'pb.json': [62, 119, 137, 54],    # Parallel bars
    'ph.json': [39, 112, 76, 20],     # Pommel horse
    'sr.json': [88, 138, 82, 54],     # Still rings
    'hb.json': [75, 108, 102, 107, 61]     # Horizontal bar
}

def add_element_groups(file_path, boundaries):
    with file_path.open('r', encoding='utf-8') as file:
        skills = json.load(file)

    current_boundary_index = 0
    current_element_group = 1
    next_boundary = boundaries[current_boundary_index]

    for skill in skills:
        current_number = skill['number']

        # Assign the element group to the skill
        skill['Element Group'] = current_element_group

        # Check if we've reached the next boundary
        if current_number >= next_boundary:
            current_element_group += 1
            current_boundary_index += 1

            # Update the next boundary if there are more boundaries
            if current_boundary_index < len(boundaries):
                next_boundary += boundaries[current_boundary_index]

    # Save the updated skills back to the JSON file
    with file_path.open('w', encoding='utf-8') as file:
        json.dump(skills, file, indent=2)

    print(f"Updated {file_path.name} with element groups.")

def process_json_files(file_list):
    for json_file in file_list:
        file_path = Path(json_file)
        if file_path.exists() and file_path.is_file():
            boundaries = element_group_boundaries.get(json_file, [])
            if boundaries:
                add_element_groups(file_path, boundaries)
            else:
                print(f"No boundaries defined for {json_file}. Skipping.")
        else:
            print(f"File {json_file} does not exist or is not a valid file.")

if __name__ == '__main__':
    # List of JSON files to process (excluding vault)
    file_list = ['fx.json', 'pb.json', 'ph.json', 'sr.json', 'hb.json']
    
    # Process each file and add element groups
    process_json_files(file_list)
