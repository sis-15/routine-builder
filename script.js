// Mapping of skill values
const skillValues = {
    'A': 0.1, 'B': 0.2, 'C': 0.3, 'D': 0.4, 'E': 0.5,
    'F': 0.6, 'G': 0.7, 'H': 0.8, 'I': 0.9
};

/**
 * Main calculation function with JO support and Sidebar
 */
function calculateTotalStartValue() {
    const event = document.getElementById("event").value;
    const isJO = document.getElementById("jo-scoring-toggle").checked;
    const level = document.getElementById("gym-level").value;
    
    // 1. Set Level-Specific Skill Caps
    let skillLimit = 10;
    if (level === "9") skillLimit = 8;
    else if (level === "8") skillLimit = 6;
    
    if (event === 'fx') {
        skillLimit = (level === "10") ? 8 : 6;
    }

    const skillDropdowns = document.querySelectorAll(".skill-dropdown");
    let allSkills = [];
    let usedGroups = new Set();
    let seenDescriptions = new Set();
    let duplicateFound = false;

    // 2. Collect Skills and Detect Duplicates
    skillDropdowns.forEach(dropdown => {
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        
        if (selectedOption && selectedOption.value !== "" && !selectedOption.disabled) {
            const desc = selectedOption.value;
            let val = 0;
            let isThisADuplicate = false;

            if (seenDescriptions.has(desc)) {
                val = 0; 
                duplicateFound = true;
                isThisADuplicate = true;
            } else {
                if (event === 'vt') {
                    val = parseFloat(selectedOption.getAttribute('data-value')) || 0;
                } else {
                    const letter = selectedOption.getAttribute('data-letter');
                    val = skillValues[letter] || 0;
                }
                seenDescriptions.add(desc);
            }

            const group = selectedOption.getAttribute('data-group');
            if (val >= 0) {
                allSkills.push({ 
                    group: group, 
                    desc: desc, 
                    value: val, 
                    isDuplicate: isThisADuplicate 
                });
                
                if (group && group !== 'Vault' && val > 0) {
                    usedGroups.add(group);
                }
            }
        }
    });

    // 3. Sort and Apply Skill Limit
    const topSkills = allSkills
        .filter(s => !s.isDuplicate)
        .sort((a, b) => b.value - a.value)
        .slice(0, skillLimit);

    const difficultySum = topSkills.reduce((acc, s) => acc + Math.round(s.value * 10), 0) / 10;

    // 4. Base and Bonuses
    const base = isJO ? 10.0 : 0.0;
    const groupBonus = (event === 'vt') ? 0 : (usedGroups.size * 0.5); 
    const cvBonus = parseFloat(document.getElementById("cv-bonus")?.value) || 0;
    const neutralDeductions = parseFloat(document.getElementById("neutral-deductions")?.value) || 0;

    // 5. Generate Warning Logic
    let warnings = "";
    if (duplicateFound) {
        warnings += `<p style="color:#e74c3c; margin:2px 0;">⚠️ Duplicate skills detected! Only the first counts.</p>`;
    }

    if (event !== 'vt' && allSkills.length > 0) {
        if (!usedGroups.has("4")) {
            warnings += `<p style="color:#e67e22; margin:2px 0;">⚠️ Missing Group IV (Dismount) Bonus.</p>`;
        }
        if (usedGroups.size < 4) {
            warnings += `<p style="color:#f39c12; margin:2px 0;">⚠️ Only ${usedGroups.size}/4 Element Groups met.</p>`;
        }
        if (allSkills.length < 6) {
            warnings += `<p style="color:#c0392b; margin:2px 0;">⚠️ Short Routine Penalty may apply.</p>`;
        }
    }

    // 6. UI Update: Scorecard
    const breakdownList = document.getElementById("breakdown-list");
    if (breakdownList) {
        let htmlBreakdown = `<ul style="list-style:none; padding:0; margin:10px 0;">`;
        topSkills.forEach(s => {
            htmlBreakdown += `<li style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:4px 0; font-size:0.85em;">
                <span>${s.desc} (Gr.${s.group})</span>
                <strong>+${s.value.toFixed(1)}</strong>
            </li>`;
        });
        htmlBreakdown += `</ul>`;

        breakdownList.innerHTML = `
            ${isJO ? `<p style="display:flex; justify-content:space-between;"><span>JO Base:</span> <strong>10.0</strong></p>` : ''}
            <div style="background:#f8f9fa; padding:5px; border-radius:4px;">
                <strong>Counting Top ${topSkills.length} Skills:</strong>
                ${htmlBreakdown}
            </div>
            <p style="display:flex; justify-content:space-between;"><span>EG Bonus:</span> <strong>+${groupBonus.toFixed(1)}</strong></p>
            <p style="display:flex; justify-content:space-between;"><span>Connections:</span> <strong>+${cvBonus.toFixed(1)}</strong></p>
            <div id="warnings-area" style="background:#fff3cd; border-radius:4px; padding:5px; margin:5px 0;">${warnings || "✅ Requirements met"}</div>
            <p style="color:#c0392b; display:flex; justify-content:space-between;"><span>Neutral Deductions:</span> <strong>-${neutralDeductions.toFixed(1)}</strong></p>
        `;
    }

    const totalSV = base + difficultySum + groupBonus + cvBonus - neutralDeductions;
    const scoreDisplay = document.getElementById("total-start-value");
    if (scoreDisplay) scoreDisplay.innerText = totalSV.toFixed(1);
}

/**
 * Re-indexes all skill boxes to maintain numerical order 1, 2, 3...
 */
function reindexSkills() {
    const event = document.getElementById("event").value;
    const boxes = document.querySelectorAll(".skill-box");

    boxes.forEach((box, i) => {
        const newIndex = i + 1;
        
        // Update Label
        const label = box.querySelector("label");
        if (label) {
            label.innerText = (event === "vt") ? "Vault Skill:" : `Skill ${newIndex}:`;
        }

        // Update Select IDs and attributes
        const groupSelect = box.querySelector(".element-group-selector");
        const skillSelect = box.querySelector(".skill-dropdown");

        if (groupSelect) {
            groupSelect.id = `element-group-${newIndex}`;
            groupSelect.setAttribute("onchange", `updateSkillDropdown(${newIndex})`);
        }
        if (skillSelect) {
            // Check if it's a vault dropdown or standard
            if (skillSelect.id.includes("vault")) {
                skillSelect.id = `vault-skill-dropdown-${newIndex}`;
            } else {
                skillSelect.id = `skill-dropdown-${newIndex}`;
            }
        }
    });
}

function updateSkillDropdown(index) {
    const event = document.getElementById("event").value;
    const elementGroupSelect = document.getElementById(`element-group-${index}`);
    const skillDropdown = document.getElementById(`skill-dropdown-${index}`);

    if (!elementGroupSelect || !skillDropdown) return;
    
    const elementGroup = elementGroupSelect.value;
    skillDropdown.innerHTML = `<option value="">-- Select Skill --</option>`;

    if (event && elementGroup) {
        fetch(`skills/${event}.json`)
            .then(response => response.json())
            .then(jsonData => {
                const filteredSkills = jsonData.filter(skill => skill["Element Group"] == elementGroup);
                filteredSkills.forEach(skill => {
                    const option = document.createElement("option");
                    option.setAttribute('data-letter', skill.value); 
                    option.setAttribute('data-group', skill["Element Group"]);
                    option.value = skill.description; 
                    option.text = `${skill.description} (${skill.value})`;
                    skillDropdown.appendChild(option);
                });
            })
            .catch(error => console.error("Error loading skills:", error));
    }
}

function loadVaultSkills(index) {
    const skillDropdown = document.getElementById(`vault-skill-dropdown-${index}`);
    if (!skillDropdown) return;

    fetch(`skills/vt.json`)
        .then(response => response.json())
        .then(jsonData => {
            skillDropdown.innerHTML = `<option value="">-- Select Vault --</option>`;
            jsonData.forEach(skill => {
                const option = document.createElement('option');
                option.setAttribute('data-value', skill.value); 
                option.setAttribute('data-group', 'Vault');
                option.value = skill.description; 
                option.textContent = `${skill.description} (SV: ${skill.value})`;
                skillDropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading Vault skills:", error));
}

function startRoutine() {
    const event = document.getElementById("event").value;
    let numSkills = parseInt(document.getElementById("num-skills").value) || 0;

    if (event === "vt") {
        numSkills = 1;
        document.getElementById("num-skills").value = 1;
    }

    const skillBoxesContainer = document.getElementById("skill-boxes");
    skillBoxesContainer.innerHTML = "";
    
    for (let i = 1; i <= numSkills; i++) {
        if (event === "vt") {
            addVaultSkillBox(i);
        } else {
            addSkillBox(i);
        }
    }
    
    // No need to reindex here as we just built them in order, 
    // but calculate the math immediately.
    calculateTotalStartValue();
}

function addSkillBox(index) {
    const container = document.getElementById("skill-boxes");
    const skillBox = document.createElement("div");
    skillBox.className = "skill-box";
    skillBox.innerHTML = `
        <label>Skill ${index}:</label>
        <select id="element-group-${index}" class="element-group-selector" onchange="updateSkillDropdown(${index})">
            <option value="">-- Group --</option>
            <option value="1">Group 1</option>
            <option value="2">Group 2</option>
            <option value="3">Group 3</option>
            <option value="4">Group 4</option>
        </select>
        <select id="skill-dropdown-${index}" class="skill-dropdown" onchange="calculateTotalStartValue()">
            <option value="">-- Select Skill --</option>
        </select>
        <button type="button" onclick="removeSkillBox(this)">Remove</button>
    `;
    container.appendChild(skillBox);
}

function addVaultSkillBox(index) {
    const container = document.getElementById("skill-boxes");
    const skillBox = document.createElement("div");
    skillBox.className = "skill-box";
    skillBox.innerHTML = `
        <label>Vault Skill:</label>
        <select id="vault-skill-dropdown-${index}" class="skill-dropdown" onchange="calculateTotalStartValue()">
            <option value="">-- Select Skill --</option>
        </select>
    `;
    container.appendChild(skillBox);
    loadVaultSkills(index);
}

function removeSkillBox(button) {
    button.parentElement.remove();
    reindexSkills(); 
    calculateTotalStartValue();
}

function addNewSkill() {
    const event = document.getElementById("event").value;
    if (event === "vt") return;
    
    // We add with a placeholder then let reindex handle the correct number
    addSkillBox(0); 
    reindexSkills();
}

// Event Listeners
document.getElementById("start-routine-btn").addEventListener("click", startRoutine);
document.getElementById("event").addEventListener("change", function() {
    if (this.value === "vt") document.getElementById("num-skills").value = 1;
    document.getElementById("skill-boxes").innerHTML = "";
    calculateTotalStartValue();
});