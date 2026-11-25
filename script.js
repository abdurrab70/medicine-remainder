// =========================
// SELECT HTML ELEMENTS
// =========================
const medicineForm = document.getElementById("medicineForm");
const medicineTableBody = document.getElementById("medicineTableBody");
const searchMedicine = document.getElementById("searchMedicine");

const totalMedicines = document.getElementById("totalMedicines");
const dailyReminders = document.getElementById("dailyReminders");
const weeklyReminders = document.getElementById("weeklyReminders");

// Modal Elements
const reminderModalEl = document.getElementById("reminderModal");
const reminderModal = new bootstrap.Modal(reminderModalEl);
const modalMedicineName = document.getElementById("modalMedicineName");
const modalMedicineDosage = document.getElementById("modalMedicineDosage");

// =========================
// SET FOOTER YEAR IMMEDIATELY
// =========================
(function setFooterYear() {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
    console.log("📅 Footer year set to:", yearEl.textContent);
  } else {
    console.warn("⚠️ #currentYear element not found!");
  }
})();

// =========================
// LOCAL STORAGE
// =========================
let medicines = JSON.parse(localStorage.getItem("medicines")) || [];

function saveToLocalStorage() {
  localStorage.setItem("medicines", JSON.stringify(medicines));
}

// =========================
// NOTIFICATION PERMISSION
// =========================
function setupNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("❌ This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    console.log("✅ Notification permission already granted.");
    return;
  }

  if (Notification.permission === "denied") {
    console.warn(
      "❌ Notification permission was DENIED. Please enable it manually: click the 🔒 lock icon in the address bar → Notifications → Allow → reload the page.",
    );
    return;
  }

  Notification.requestPermission().then((permission) => {
    console.log("🔔 Notification permission result:", permission);
    if (permission === "granted") {
      try {
        new Notification("✅ Notifications Enabled!", {
          body: "You will now receive medicine reminders.",
        });
      } catch (err) {
        console.warn("Notification failed:", err.message);
      }
    }
  });
}

// Ask on first user interaction (more reliable than page load)
document.addEventListener(
  "click",
  function askPermissionOnce() {
    if (Notification.permission === "default") {
      setupNotificationPermission();
    }
    document.removeEventListener("click", askPermissionOnce);
  },
  { once: true },
);

// =========================
// DISPLAY MEDICINES
// =========================
function displayMedicines() {
  medicineTableBody.innerHTML = "";
  const emptyState = document.getElementById("emptyState");

  if (medicines.length === 0) {
    emptyState.classList.remove("d-none");
  } else {
    emptyState.classList.add("d-none");
  }

  medicines.forEach((medicine, index) => {
    let freqClass = "freq-daily";
    if (medicine.frequency === "Twice Daily") freqClass = "freq-twice";
    if (medicine.frequency === "Weekly") freqClass = "freq-weekly";

    const row = `
            <tr>
                <td class="text-muted fw-semibold">${index + 1}</td>
                <td class="fw-semibold">${medicine.name}</td>
                <td>${medicine.dosage}</td>
                <td><i class="bi bi-clock me-1 text-muted"></i>${medicine.time}</td>
                <td>
                    <span class="freq-badge ${freqClass}">${medicine.frequency}</span>
                </td>
                <td class="text-center">
                    <button class="btn-action btn-edit me-1" onclick="editMedicine(${index})" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteMedicine(${index})" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    medicineTableBody.innerHTML += row;
  });

  updateDashboard();
}

// =========================
// UPDATE DASHBOARD (NULL-SAFE)
// =========================
function updateDashboard() {
  if (totalMedicines) totalMedicines.innerText = medicines.length;

  const daily = medicines.filter((med) => med.frequency === "Daily").length;
  const weekly = medicines.filter((med) => med.frequency === "Weekly").length;

  if (dailyReminders) dailyReminders.innerText = daily;
  if (weeklyReminders) weeklyReminders.innerText = weekly;
}

// =========================
// ADD MEDICINE
// =========================
medicineForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const medicine = {
    name: document.getElementById("medicineName").value,
    dosage: document.getElementById("medicineDosage").value,
    time: document.getElementById("medicineTime").value,
    frequency: document.getElementById("medicineFrequency").value,
  };

  medicines.push(medicine);
  saveToLocalStorage();
  displayMedicines();
  medicineForm.reset();

  showFeedbackModal(
    "Medicine Added!",
    "Your reminder has been created successfully.",
  );
});

// =========================
// EDIT MEDICINE
// =========================
function editMedicine(index) {
  const medicine = medicines[index];
  document.getElementById("medicineName").value = medicine.name;
  document.getElementById("medicineDosage").value = medicine.dosage;
  document.getElementById("medicineTime").value = medicine.time;
  document.getElementById("medicineFrequency").value = medicine.frequency;

  medicines.splice(index, 1);
  saveToLocalStorage();
  displayMedicines();
}

// =========================
// DELETE MEDICINE
// =========================
function deleteMedicine(index) {
  if (confirm("Are you sure you want to delete this reminder?")) {
    medicines.splice(index, 1);
    saveToLocalStorage();
    displayMedicines();
  }
}

// =========================
// SEARCH
// =========================
searchMedicine.addEventListener("keyup", function () {
  const searchValue = searchMedicine.value.toLowerCase();
  const rows = document.querySelectorAll("#medicineTableBody tr");

  rows.forEach((row) => {
    const name = row.children[1].textContent.toLowerCase();
    row.style.display = name.includes(searchValue) ? "" : "none";
  });
});

// =========================
// REMINDER CHECKER
// =========================
function checkMedicineReminder() {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  medicines.forEach((medicine) => {
    if (medicine.time === currentTime) {
      showReminderModal(medicine);

      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("💊 Medicine Reminder", {
            body: `Time to take ${medicine.name} (${medicine.dosage})`,
          });
        } catch (err) {
          console.warn("Notification failed:", err.message);
        }
      }
    }
  });
}

// =========================
// SHOW REMINDER MODAL
// =========================
function showReminderModal(medicine) {
  if (!medicine) return;
  modalMedicineName.innerText = medicine.name;
  modalMedicineDosage.innerText = medicine.dosage + " • " + medicine.frequency;
  reminderModal.show();
}

// =========================
// SIMPLE FEEDBACK MODAL
// =========================
function showFeedbackModal(title, message) {
  modalMedicineName.innerText = title;
  modalMedicineDosage.innerText = message;
  reminderModal.show();
}

// Check every 30 seconds
setInterval(checkMedicineReminder, 30000);

// =========================
// INITIAL LOAD
// =========================
displayMedicines();

// =========================
// NOTIFICATION DEBUG HELPERS
// =========================
window.testNotification = function () {
  if (!("Notification" in window)) {
    alert("❌ This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification("💊 Test Notification", {
        body: "Notifications are working perfectly!",
      });
      console.log("✅ Test notification sent.");
    } catch (err) {
      alert("Notification error: " + err.message);
    }
  } else if (Notification.permission === "denied") {
    alert(
      "❌ Notifications are BLOCKED.\n\nFix it:\n1. Click the 🔒 lock icon in the address bar\n2. Find 'Notifications'\n3. Set it to 'Allow'\n4. Reload the page",
    );
  } else {
    alert(
      "⚠️ Permission not yet granted. Clicking OK will ask for permission now.",
    );
    setupNotificationPermission();
  }
};

window.checkNotificationStatus = function () {
  if (!("Notification" in window)) {
    console.log("❌ Notifications not supported.");
    return;
  }
  console.log("📊 Notification.permission =", Notification.permission);
  console.log("🌐 Protocol =", window.location.protocol);
  console.log("🏠 Host =", window.location.host);
};
