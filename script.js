document.getElementById('eventSelect').addEventListener('change', function() {
    const event = this.value;
    loadSkills(event);
  });
  
  function loadSkills(event) {
    const skillsSection = document.getElementById('skills');
    skillsSection.innerHTML = `<h2>Skills for ${event}</h2>`;
    // Load skills dynamically here
  }