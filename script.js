// Mapping of skill values
const skillValues = {
  'A': 0.1,
  'B': 0.2,
  'C': 0.3,
  'D': 0.4,
  'E': 0.5,
  'F': 0.6,
  'G': 0.7,
  'H': 0.8,
  'I': 0.9
};

// Function to calculate the total start value
function calculateTotalStartValue() {
    const event = document.getElementById("event").value;
    let totalValue = 10.0; // Default starting value for all events except Vault

    if (event === 'vt') {
        // Vault-specific calculation
        const skillDropdown = document.querySelector(".skill-dropdown");
        if (skillDropdown && skillDropdown.value) {
            const selectedSkillValue = skillDropdown.value.match(/\(([^)]+)\)/);
            if (selectedSkillValue) {
                const skillValue = parseFloat(selectedSkillValue[1]); // Extract numeric value for Vault
                totalValue = skillValue; // Set total value directly to the Vault skill value
            }
        }
    } else {
        // Calculation for other events
        const skillDropdowns = document.querySelectorAll(".skill-dropdown");

        skillDropdowns.forEach(dropdown => {
            const selectedOption = dropdown.value;
            if (selectedOption) {
                const selectedSkillValue = selectedOption.match(/\(([^)]+)\)/);
                if (selectedSkillValue) {
                    const skillValue = selectedSkillValue[1]; // Get the letter value for non-Vault events
                    totalValue += skillValues[skillValue] || 0; // Add the skill value for non-Vault events
                }
            }
        });
    }

    // Update the total start value on the page
    document.getElementById("total-start-value").innerText = totalValue.toFixed(1);
}

// Update the skill dropdown and recalculate total when a skill is selected
function updateSkillDropdown(index) {
  const event = document.getElementById("event").value;
  const elementGroup = document.getElementById(`element-group-${index}`).value;
  const skillDropdown = document.getElementById(`skill-dropdown-${index}`);

  // Clear previous options
  skillDropdown.innerHTML = `<option value="">-- Select Skill --</option>`;

  if (event && elementGroup) {
      // Load skills dynamically based on event and element group
      fetch(`skills/${event}.json`)
          .then(response => response.json())
          .then(jsonData => {
              const filteredSkills = jsonData.filter(skill => skill["Element Group"] == elementGroup);
              filteredSkills.forEach(skill => {
                  const option = document.createElement("option");
                  option.value = `${skill.description} (${skill.value})`; // Include value for calculation
                  option.text = `${skill.description} (${skill.value})`;
                  skillDropdown.appendChild(option);
              });
          })
          .catch(error => console.error("Error loading skills:", error));
  }
}

document.getElementById("start-routine-btn").addEventListener("click", startRoutine);
document.getElementById("pdf-link-btn").addEventListener("click", function () {
    window.location.href = "TrimmedCoP2025-2028.pdf"; // Link to embedded PDF
});
document.getElementById('event').addEventListener('change', loadSkills);

// Function to start the routine by dynamically generating skill boxes
function startRoutine() {
    const event = document.getElementById("event").value;
    let numSkills = document.getElementById("num-skills").value;

    // Restrict to 1 skill if the event is Vault
    if (event === "vt") {
        numSkills = 1;
        document.getElementById("num-skills").value = 1; // Update the input to reflect the restriction
    }

    const skillBoxesContainer = document.getElementById("skill-boxes");
    skillBoxesContainer.innerHTML = "";
    for (let i = 1; i <= numSkills; i++) {
        if (event === "vt") {
            addVaultSkillBox(i); // Use a specific function for Vault
        } else {
            addSkillBox(i); // Use the regular skill box for other events
        }
    }
}

// Update the event selection to ensure num-skills is correctly set
document.getElementById("event").addEventListener("change", function() {
    const event = this.value;
    if (event === "vt") {
        document.getElementById("num-skills").value = 1; // Set to 1 when Vault is selected
    }
});

// Function to add a skill box for Vault (without element groups)
function addVaultSkillBox(index) {
    const skillBoxesContainer = document.getElementById("skill-boxes");
    const skillBox = document.createElement("div");
    skillBox.className = "skill-box";
    skillBox.innerHTML = `
        <label for="vault-skill-dropdown-${index}">Skill ${index}:</label>
        <select id="vault-skill-dropdown-${index}" class="skill-dropdown" onchange="calculateTotalStartValue()">
            <option value="">-- Select Skill --</option>
        </select>
    `;
    skillBoxesContainer.appendChild(skillBox);

    // Load Vault skills dynamically
    loadVaultSkills(index);
}

// Function to load Vault skills (no element group)
function loadVaultSkills(index) {
    const skillDropdown = document.getElementById(`vault-skill-dropdown-${index}`);

    fetch(`skills/vt.json`)
        .then(response => response.json())
        .then(jsonData => {
            jsonData.forEach(skill => {
                const option = document.createElement('option');
                option.value = skill.description; // Skill description
                option.setAttribute('data-value', skill.value); // Store the value as a data attribute
                option.textContent = `${skill.description} (Value: ${skill.value})`;
                skillDropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error loading Vault skills:", error);
        });
}

// Function to add a skill box
function addSkillBox(index) {
  const skillBoxesContainer = document.getElementById("skill-boxes");
  const skillBox = document.createElement("div");
  skillBox.className = "skill-box";
  skillBox.innerHTML = `
      <label for="element-group-${index}">Skill ${index}:</label>
      <select id="element-group-${index}" class="element-group-selector" onchange="updateSkillDropdown(${index})">
          <option value="">-- Select Element Group --</option>
          <option value="1">Element Group 1</option>
          <option value="2">Element Group 2</option>
          <option value="3">Element Group 3</option>
          <option value="4">Element Group 4</option>
      </select>
      <select id="skill-dropdown-${index}" class="skill-dropdown" onchange="calculateTotalStartValue()">
          <option value="">-- Select Skill --</option>
      </select>
      <button type="button" onclick="removeSkillBox(this)">Remove Skill</button>
  `;
  skillBoxesContainer.appendChild(skillBox);
  updateRemoveButtonVisibility();
  updateNumSkillsInput(); // Update the num-skills input
}

function removeSkillBox(button) {
  const skillBox = button.parentElement; // Get the parent skill box
  skillBox.remove(); // Remove the skill box
  calculateTotalStartValue(); // Recalculate the total start value
  updateRemoveButtonVisibility();
  updateNumSkillsInput(); // Update the num-skills input
}

// Function to update the num-skills input to reflect the current number of skill boxes
function updateNumSkillsInput() {
  const skillBoxesContainer = document.getElementById("skill-boxes");
  const skillCount = skillBoxesContainer.childElementCount; // Count current skill boxes
  document.getElementById("num-skills").value = skillCount; // Update the input
}

// Function to update the visibility of remove buttons
function updateRemoveButtonVisibility() {
  const skillBoxesContainer = document.getElementById("skill-boxes");
  const skillBoxes = skillBoxesContainer.getElementsByClassName("skill-box");
  for (let i = 0; i < skillBoxes.length; i++) {
      const removeButton = skillBoxes[i].querySelector("button");
      if (skillBoxes.length === 1) {
          removeButton.style.display = "none"; // Hide button if it's the last skill box
      } else {
          removeButton.style.display = "inline"; // Show button if there's more than one skill box
      }
  }
}

// Function to add a new skill box
function addNewSkill() {
  const skillBoxesContainer = document.getElementById("skill-boxes");
  const newIndex = skillBoxesContainer.childElementCount + 1; // New skill box index
  addSkillBox(newIndex); // Call function to add the skill box
}

// Update the button to add a new skill box
const addSkillButton = document.createElement("button");
addSkillButton.innerText = "Add Skill";
addSkillButton.type = "button";
addSkillButton.onclick = addNewSkill;
document.getElementById("skill-routine").appendChild(addSkillButton);

// Clear skill boxes and reset the input fields when event is changed
function setSkillCount() {
    document.getElementById('skill-boxes').innerHTML = ''; // Clear skill boxes
    document.getElementById('num-skills').value = ''; // Reset skill count input
}

// Generate skill boxes dynamically when the user selects the number of skills for the routine
function generateSkillBoxes() {
    const skillCount = parseInt(document.getElementById('num-skills').value);
    const event = document.getElementById('event').value;

    if (isNaN(skillCount) || !event) {
        alert("Please select an event and enter a valid number of skills.");
        return;
    }

    const container = document.getElementById('skill-boxes');
    container.innerHTML = ''; // Clear previous boxes

    // Create skill selection boxes dynamically
    for (let i = 0; i < skillCount; i++) {
        const skillBox = document.createElement('div');
        skillBox.innerHTML = `
            <h3>Skill ${i + 1}</h3>
            <label for="element-group-${i}">Select Element Group:</label>
            <select id="element-group-${i}" onchange="loadSkills(${i})">
                <option value="">Select Element Group</option>
                <option value="1">Element Group 1</option>
                <option value="2">Element Group 2</option>
                <option value="3">Element Group 3</option>
                <option value="4">Element Group 4</option>
            </select>
            <br><br>
            <label for="skill-dropdown-${i}">Select Skill:</label>
            <select id="skill-dropdown-${i}">
                <option value="">Select a skill</option>
            </select>
            <br><br>
        `;
        container.appendChild(skillBox);
    }
}

// Load skills dynamically for a given skill box when an element group is selected
function loadSkills() {
    const eventSelect = document.getElementById('event');
    const selectedEvent = eventSelect.value;
    const addSkillButton = document.getElementById('add-skill-btn');

    // Show or hide the add skill button based on the selected event
    if (selectedEvent === 'vt') { // Vault
        addSkillButton.style.display = 'none'; // Hide button
    } else {
        addSkillButton.style.display = 'block'; // Show button
    }

    // Load skills based on selected event
    if (selectedEvent) {
        fetch(`skills/${selectedEvent}.json`)
            .then(response => response.json())
            .then(jsonData => {
                // You may want to handle the loaded skills here
                console.log(jsonData); // For debugging purposes
            })
            .catch(error => console.error("Error loading skills:", error));
    }

    fetch(`skills/${event}.json`)
        .then(response => response.json())
        .then(jsonData => {
            skillDropdown.innerHTML = '<option value="">Select a skill</option>';

            // Populate dropdown with filtered skills by selected element group
            jsonData.forEach(skill => {
                if (skill["Element Group"] === parseInt(elementGroup)) {
                    const option = document.createElement('option');
                    option.value = skill.description;
                    option.textContent = `${skill.description} (Value: ${skill.value})`;
                    skillDropdown.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error("Error loading skills:", error);
        });
}
