document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: simple HTML escaper to avoid injection from activity data
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Helper: derive 1-2 letter initials from email local part
  function getInitials(email) {
    const local = (email || "").split("@")[0] || "";
    const parts = local.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (parts.length === 0) return (local[0] || "").toUpperCase();
    if (parts.length === 1) return (parts[0][0] || "").toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to fetch activities from API

// Function to unregister a participant
async function unregisterParticipant(activity, email) {
  try {
    const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to unregister participant');
    }
    fetchActivities(); // Refresh the activities list
  } catch (error) {
    console.error('Error unregistering participant:', error);
  }
}
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options on refresh
      activitySelect.innerHTML = '<option value="">Select an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = Array.isArray(details.participants) ? details.participants : [];
        // Build participants HTML
const participantsSection =
          participants.length > 0
            ? `<div class="participants">
                 <h5>Participants</h5>
                 <ul>
                   ${participants
                     .map((p) => {
                       const initials = escapeHtml(getInitials(p));
                       const email = escapeHtml(p);
                       return `<li><span class="avatar" aria-hidden="true">${initials}</span><span class="participant-email">${email}</span><button class="delete-button" data-email="${email}" aria-label="Remove participant">🗑️</button></li>`;
                     })
                     .join("")}
                 </ul>
               </div>`
            : `<div class="participants">
                 <h5>Participants</h5>
                 <p class="no-participants">No participants yet</p>
               </div>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsSection}
        `;

        activitiesList.appendChild(activityCard);

        // Wire up delete buttons inside this card
        const deleteButtons = activityCard.querySelectorAll('.delete-button');
        deleteButtons.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const email = btn.getAttribute('data-email');
            unregisterParticipant(name, email);
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
