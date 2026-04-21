const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const messageEl = document.getElementById("message");
const calendarEl = document.getElementById("calendar");
const welcomeEl = document.getElementById("welcome");
const activeSlotEl = document.getElementById("active-slot");
const logoutBtn = document.getElementById("logout-btn");

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#b91c1c" : "#166534";
}

function toLocalDateLabel(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function toTimeLabel(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Error inesperado");
  }
  return data;
}

async function refreshSession() {
  try {
    const { user } = await api("/api/auth/me");
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    welcomeEl.textContent = `Conectado como ${user.name} (Casa ${user.houseNumber})`;
    await loadCalendar(user);
  } catch (_error) {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
  }
}

function groupSlotsByDay(slots) {
  const map = new Map();
  for (const slot of slots) {
    const date = new Date(slot.slotStart).toISOString().slice(0, 10);
    if (!map.has(date)) {
      map.set(date, []);
    }
    map.get(date).push(slot);
  }
  return map;
}

function renderCalendar(user, slots, reservations) {
  const reservationByStart = new Map(reservations.map((r) => [r.slotStart, r]));
  const grouped = groupSlotsByDay(slots);
  calendarEl.innerHTML = "";

  for (const [date, daySlots] of grouped.entries()) {
    const card = document.createElement("article");
    card.className = "day-card";
    const title = document.createElement("h3");
    title.textContent = toLocalDateLabel(`${date}T00:00:00`);
    card.appendChild(title);

    const slotsWrap = document.createElement("div");
    slotsWrap.className = "slots";

    for (const slot of daySlots) {
      const row = document.createElement("div");
      row.className = "slot";

      const info = document.createElement("div");
      info.className = "slot-info";
      info.innerHTML = `<strong>${toTimeLabel(slot.slotStart)} - ${toTimeLabel(slot.slotEnd)}</strong>`;

      const booking = reservationByStart.get(slot.slotStart);
      if (booking) {
        row.classList.add("reserved");
        if (booking.userId === user.id) {
          row.classList.add("mine");
          info.innerHTML += `<span class="small">Reservada por ti</span>`;
        } else {
          info.innerHTML += `<span class="small">Reservada por ${booking.userName} (Casa ${booking.houseNumber})</span>`;
        }
      }

      const button = document.createElement("button");
      button.textContent = booking ? "Ocupada" : "Reservar";
      button.disabled = Boolean(booking);
      button.addEventListener("click", async () => {
        try {
          await api("/api/reservations", {
            method: "POST",
            body: JSON.stringify({ slotStart: slot.slotStart }),
          });
          showMessage("Reserva creada correctamente");
          await loadCalendar(user);
        } catch (error) {
          showMessage(error.message, true);
        }
      });

      row.appendChild(info);
      row.appendChild(button);
      slotsWrap.appendChild(row);
    }

    card.appendChild(slotsWrap);
    calendarEl.appendChild(card);
  }
}

async function loadCalendar(user) {
  const [calendarData, activeData] = await Promise.all([
    api("/api/reservations"),
    api("/api/reservations/active"),
  ]);

  if (activeData.active) {
    activeSlotEl.textContent = `Ahora mismo la pista está en uso por ${activeData.active.userName} (Casa ${activeData.active.houseNumber}) hasta las ${toTimeLabel(activeData.active.slotEnd)}.`;
  } else {
    activeSlotEl.textContent = "Ahora mismo no hay ninguna sesión activa.";
  }

  renderCalendar(user, calendarData.slots, calendarData.reservations);
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(registerForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage("Cuenta creada y sesión iniciada");
    registerForm.reset();
    await refreshSession();
  } catch (error) {
    showMessage(error.message, true);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  try {
    const payload = Object.fromEntries(formData.entries());
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage("Sesión iniciada");
    loginForm.reset();
    await refreshSession();
  } catch (error) {
    showMessage(error.message, true);
  }
});

logoutBtn.addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  showMessage("Sesión cerrada");
  await refreshSession();
});

refreshSession();
