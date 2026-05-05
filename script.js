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
    
    let skillLimit = (level === "10" && event === 'fx') ? 8 : 10; 

    const skillDropdowns = document.querySelectorAll(".skill-dropdown");
    let allSkills = [];
    let seenDescriptions = new Set();
    let duplicateFound = false;

    // 1. Collect Skills
    skillDropdowns.forEach((dropdown, index) => {
        const selectedOption = dropdown.options[dropdown.selectedIndex];
        const isLastBox = (index === skillDropdowns.length - 1);
        
        if (selectedOption && selectedOption.value !== "" && !selectedOption.disabled) {
            const desc = selectedOption.value;
            const letter = selectedOption.getAttribute('data-letter');
            const val = skillValues[letter] || 0;

            if (seenDescriptions.has(desc)) {
                duplicateFound = true;
            } else {
                seenDescriptions.add(desc);
                allSkills.push({ 
                    group: selectedOption.getAttribute('data-group'), 
                    desc: desc, 
                    value: val, 
                    isDismount: isLastBox && event !== 'vt'
                });
            }
        }
    });

    // 2. Sort and Identify Top Skills
    const dismountSkill = allSkills.find(s => s.isDismount);
    const otherSkills = allSkills.filter(s => !s.isDismount);
    const topSkills = otherSkills.sort((a, b) => b.value - a.value).slice(0, skillLimit - 1);
    if (dismountSkill) topSkills.push(dismountSkill);

    const difficultySum = topSkills.reduce((acc, s) => acc + Math.round(s.value * 10), 0) / 10;

    // 3. JO Logic (EG and Penalty)
    let groupBonus = 0;
    let joPenalty = 0;

    if (isJO && event === 'fx') {
        // Map to find the best skill value per group across the entire routine
        const groupBestSkills = {};
        allSkills.forEach(s => {
            if (s.group) {
                const g = s.group.toString();
                if (!groupBestSkills[g] || s.value > groupBestSkills[g]) {
                    groupBestSkills[g] = s.value;
                }
            }
        });

        // 4. Calculate 1.6 Bonus Logic
        // Group 1: 0.5 by default if present
        // Groups 2-4: 0.5 if best skill is D (0.4)+, else 0.3
        for (let i = 1; i <= 4; i++) {
            const gKey = i.toString();
            if (groupBestSkills[gKey] !== undefined) {
                if (i === 1) {
                    groupBonus += 0.5; // EG1 default
                } else {
                    groupBonus += (groupBestSkills[gKey] >= 0.4) ? 0.5 : 0.3;
                }
            }
        }

        // 5. Neutral Deduction Penalty (-0.3)
        if (level === "10" && dismountSkill) {
            const descLower = dismountSkill.desc.toLowerCase();
            const isDoubleSalto = descLower.includes("double") || descLower.includes("triple");
            const isDPlusTwist = dismountSkill.value >= 0.4;
            
            if (!isDoubleSalto && !isDPlusTwist) {
                joPenalty = 0.3; 
            }
        }
    }

    // 6. Final Math
    const base = isJO ? 10.0 : 0.0;
    const cvBonus = parseFloat(document.getElementById("cv-bonus")?.value) || 0;
    const totalNeutral = joPenalty; 

    // Calculation Check: 10.0 (Base) + 2.0 (DV) + 1.6 (EG) - 0.3 (Penalty) = 13.3
    const totalSV = base + difficultySum + groupBonus + cvBonus - totalNeutral;

    // 7. Push to UI
    updateScorecardUI({
        isJO, topSkills, groupBonus, cvBonus, 
        dismountBonus: 0, 
        totalNeutral, base, joPenalty, duplicateFound
    });

    document.getElementById("total-start-value").innerText = totalSV.toFixed(1);
}

/**
 * Re-indexes all skill boxes to maintain numerical order 1, 2, 3...
 */
function reindexSkills() {
    const event = document.getElementById("event").value;
    const boxes = document.querySelectorAll(".skill-box");
    const totalBoxes = boxes.length;

    boxes.forEach((box, i) => {
        const newIndex = i + 1;
        const isLast = (newIndex === totalBoxes);
        
        // 1. Handle Label and Styling
        const label = box.querySelector("label");
        if (label) {
            if (event === "vt") {
                label.innerText = "Vault Skill:";
                box.classList.remove("dismount-box");
            } else if (isLast && totalBoxes > 0) {
                label.innerText = "Dismount:";
                box.classList.add("dismount-box"); // Adds the red styling
            } else {
                label.innerText = `Skill ${newIndex}:`;
                box.classList.remove("dismount-box");
            }
        }

        // 2. Update Select IDs and attributes
        const groupSelect = box.querySelector(".element-group-selector");
        const skillSelect = box.querySelector(".skill-dropdown");

        if (groupSelect) {
            groupSelect.id = `element-group-${newIndex}`;
            groupSelect.setAttribute("onchange", `updateSkillDropdown(${newIndex})`);
        }
        if (skillSelect) {
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

function updateScorecardUI(data) {
    const breakdownList = document.getElementById("breakdown-list");
    if (!breakdownList) return;

    let warnings = "";
    // Display specific Level 10 penalty warning with a negative sign
    if (data.joPenalty > 0) {
        warnings += `<p style="color:#e74c3c; margin:2px 0;">⚠️ -${data.joPenalty.toFixed(1)} Dismount Penalty (No Double Flip)</p>`;
    }
    if (data.duplicateFound) {
        warnings += `<p style="color:#e74c3c; margin:2px 0;">⚠️ Duplicate skills detected!</p>`;
    }

    breakdownList.innerHTML = `
        ${data.isJO ? `<p style="display:flex; justify-content:space-between;"><span>JO Base:</span> <strong>${data.base.toFixed(1)}</strong></p>` : ''}
        
        <div style="background:#f8f9fa; padding:5px; border-radius:4px; border: 1px solid #ddd;">
            <strong>Counting Top ${data.topSkills.length} Skills:</strong>
            <ul style="list-style:none; padding:0; margin:5px 0;">
                ${data.topSkills.map(s => `
                    <li style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:4px 0; font-size:0.85em;">
                        <span>${s.isDismount ? '<b style="color:#e74c3c;">[DISMOUNT]</b> ' : ''}${s.desc}</span>
                        <strong>+${s.value.toFixed(1)}</strong>
                    </li>`).join('')}
            </ul>
        </div>

        <div style="margin-top: 10px;">
            <p style="display:flex; justify-content:space-between;"><span>EG Bonus:</span> <strong>+${data.groupBonus.toFixed(1)}</strong></p>
            ${data.isJO && data.dismountBonus > 0 ? `<p style="display:flex; justify-content:space-between;"><span>Dismount Bonus:</span> <strong>+${data.dismountBonus.toFixed(1)}</strong></p>` : ''}
            <p style="display:flex; justify-content:space-between;"><span>Connections:</span> <strong>+${data.cvBonus.toFixed(1)}</strong></p>
        </div>

        <div id="warnings-area" style="background:#fff3cd; border-radius:4px; padding:5px; margin:5px 0;">
            ${warnings || "✅ Requirements met"}
        </div>

        <p style="color:#c0392b; display:flex; justify-content:space-between; border-top: 1px solid #c0392b; padding-top: 5px;">
            <span>Neutral Deductions:</span> 
            <strong>-${data.totalNeutral.toFixed(1)}</strong>
        </p>
    `;
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
    
    reindexSkills();
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
        <button type="button" class="remove-btn" onclick="removeSkillBox(this)">Remove</button>
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