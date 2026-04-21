import { useEffect, useMemo, useState } from "react";

function toLocalDateLabel(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "long",
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
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la acción");
  }

  return data;
}

function groupSlotsByDay(slots) {
  const map = new Map();
  for (const slot of slots) {
    const date = new Date(slot.slotStart).toISOString().slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date).push(slot);
  }
  return map;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", error: false });
  const [dialog, setDialog] = useState(null);
  const [dialogError, setDialogError] = useState("");

  const grouped = useMemo(() => groupSlotsByDay(slots), [slots]);
  const reservationByStart = useMemo(
    () => new Map(reservations.map((r) => [r.slotStart, r])),
    [reservations]
  );

  const showMessage = (text, error = false) => setMessage({ text, error });

  async function loadCalendar() {
    const [calendarData, activeData] = await Promise.all([
      api("/api/reservations"),
      api("/api/reservations/active"),
    ]);
    setSlots(calendarData.slots);
    setReservations(calendarData.reservations);
    setActive(activeData.active);
  }

  async function refreshSession() {
    setLoading(true);
    try {
      const me = await api("/api/auth/me");
      setUser(me.user);
      await loadCalendar();
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function submitRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      showMessage("Cuenta creada. Reiniciando automáticamente...");
      if (form && typeof form.reset === "function") form.reset();
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      showMessage("Sesión iniciada. Reiniciando automáticamente...");
      if (form && typeof form.reset === "function") form.reset();
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setSlots([]);
    setReservations([]);
    setActive(null);
    showMessage("Sesión cerrada");
  }

  async function reserveSlot(slotStart) {
    await api("/api/reservations", {
      method: "POST",
      body: JSON.stringify({ slotStart }),
    });
    showMessage("Reserva creada");
    await loadCalendar();
  }

  async function cancelReservation(reservationId) {
    await api(`/api/reservations/${reservationId}`, {
      method: "DELETE",
    });
    showMessage("Reserva cancelada");
    await loadCalendar();
  }

  async function submitDialog(event) {
    event.preventDefault();
    if (!dialog) {
      return;
    }

    try {
      if (dialog.type === "reserve") {
        await reserveSlot(dialog.slotStart);
      }
      if (dialog.type === "cancel") {
        await cancelReservation(dialog.reservationId);
      }
      setDialog(null);
      setDialogError("");
    } catch (error) {
      const reason = error.message || "No se pudo completar la acción";
      setDialogError(reason);
      showMessage(reason, true);
    }
  }

  if (loading) {
    return <div className="loading">Cargando aplicación...</div>;
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="badge">Urbanización · Comunidad</p>
        <h1>Reservas Padel</h1>
        <p>Gestiona tus turnos con reglas automáticas y un calendario de 30 días en un entorno más alegre.</p>
      </header>

      {!user ? (
        <section className="auth-grid">
          <form className="panel glass" onSubmit={submitRegister}>
            <h2>Crear cuenta</h2>
            <label>Email<input name="email" type="email" required /></label>
            <label>Nombre<input name="name" type="text" required /></label>
            <label>Número de casa<input name="houseNumber" type="text" required /></label>
            <label>Contraseña<input name="password" type="password" minLength={6} required /></label>
            <button type="submit">Registrarse</button>
          </form>
          <form className="panel glass" onSubmit={submitLogin}>
            <h2>Iniciar sesión</h2>
            <label>Número de casa<input name="houseNumber" type="text" required /></label>
            <label>Contraseña<input name="password" type="password" required /></label>
            <button type="submit">Entrar</button>
          </form>
        </section>
      ) : (
        <section className="panel">
          <div className="toolbar">
            <div>
              <h2>Hola {user.name}</h2>
              <p>Casa {user.houseNumber}</p>
            </div>
            <button className="secondary" onClick={logout}>Cerrar sesión</button>
          </div>

          <div className="active-card">
            {active
              ? `Pista en uso por ${active.userName} (Casa ${active.houseNumber}) hasta ${toTimeLabel(active.slotEnd)}`
              : "Ahora mismo no hay sesión activa."}
          </div>

          <p className="rules">Reglas: máximo 4/semana, máximo 1 en fin de semana, sin sesiones consecutivas.</p>

          <div className="calendar">
            {[...grouped.entries()].map(([date, daySlots]) => (
              <article className="day-card" key={date}>
                <h3>{toLocalDateLabel(`${date}T00:00:00`)}</h3>
                <div className="slots">
                  {daySlots.map((slot) => {
                    const booking = reservationByStart.get(slot.slotStart);
                    const isMine = booking && booking.userId === user.id;
                    return (
                      <div
                        key={slot.slotStart}
                        className={`slot ${booking ? "reserved" : ""} ${isMine ? "mine" : ""}`}
                      >
                        <div>
                          <strong>{toTimeLabel(slot.slotStart)} - {toTimeLabel(slot.slotEnd)}</strong>
                          <p>
                            {booking
                              ? isMine
                                ? "Reservada por ti"
                                : `Reservada por ${booking.userName} (Casa ${booking.houseNumber})`
                              : "Disponible"}
                          </p>
                        </div>
                        <button
                          disabled={Boolean(booking)}
                          onClick={() =>
                            setDialog({
                              type: "reserve",
                              slotStart: slot.slotStart,
                              title: "Confirmar reserva",
                              description: `Vas a reservar la sesión ${toTimeLabel(slot.slotStart)} - ${toTimeLabel(slot.slotEnd)}.`,
                            })
                          }
                        >
                          {booking ? "Ocupada" : "Reservar"}
                        </button>
                        {isMine ? (
                          <button
                            className="danger"
                            onClick={() =>
                              setDialog({
                                type: "cancel",
                                reservationId: booking.id,
                                title: "Cancelar reserva",
                                description: `Vas a cancelar tu sesión ${toTimeLabel(slot.slotStart)} - ${toTimeLabel(slot.slotEnd)}.`,
                              })
                            }
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {message.text ? (
        <p className={`feedback ${message.error ? "error" : "ok"}`}>{message.text}</p>
      ) : null}

      {dialog ? (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{dialog.title}</h3>
            <p>{dialog.description}</p>
            <form onSubmit={submitDialog}>
              {dialogError ? <p className="dialog-error">{dialogError}</p> : null}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setDialog(null);
                    setDialogError("");
                  }}
                >
                  Cerrar
                </button>
                <button type="submit">{dialog.type === "reserve" ? "Confirmar" : "Sí, cancelar"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
