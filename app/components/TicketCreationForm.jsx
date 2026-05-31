"use client";

import { useMemo, useState } from "react";
import { FiAlertCircle, FiSend } from "react-icons/fi";
import { createTicketSchema } from "@/lib/validation/tickets";
import styles from "./TicketCreationForm.module.css";

const priorities = [
  { value: "low", label: "Low", detail: "48 hour SLA" },
  { value: "medium", label: "Medium", detail: "24 hour SLA" },
  { value: "high", label: "High", detail: "4 hour SLA" },
  { value: "critical", label: "Critical", detail: "1 hour SLA" }
];

function flattenValidationErrors(result) {
  if (result.success) {
    return {};
  }

  const fields = result.error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(fields).map(([key, messages]) => [key, messages?.[0] || "Invalid value."])
  );
}

export default function TicketCreationForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium"
  });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterStats = useMemo(
    () => ({
      title: `${form.title.trim().length}/160`,
      description: `${form.description.trim().length}/5000`
    }),
    [form.description, form.title]
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerMessage("");
  }

  async function submitTicket(event) {
    event.preventDefault();
    setServerMessage("");
    setCreatedTicket(null);

    const validation = createTicketSchema.safeParse(form);
    const validationErrors = flattenValidationErrors(validation);

    if (!validation.success) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(validation.data)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerMessage(body?.error?.message || "Ticket could not be created.");
        return;
      }

      setCreatedTicket(body.ticket);
      setForm({
        title: "",
        description: "",
        priority: "medium"
      });
      setErrors({});
    } catch {
      setServerMessage("Network error while creating the ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.shell} aria-labelledby="new-ticket-title">
      <div className={styles.header}>
        <FiAlertCircle aria-hidden="true" />
        <div>
          <h1 id="new-ticket-title">Create Ticket</h1>
          <p>Capture the issue clearly so the service desk can route and resolve it quickly.</p>
        </div>
      </div>

      <form className={styles.form} onSubmit={submitTicket} noValidate>
        <label className={styles.field}>
          <span>Subject</span>
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            maxLength={160}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : "title-count"}
            placeholder="VPN fails after password reset"
          />
          <small id="title-count">{characterStats.title}</small>
          {errors.title && (
            <strong id="title-error" className={styles.error}>
              {errors.title}
            </strong>
          )}
        </label>

        <label className={styles.field}>
          <span>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={updateField}
            maxLength={5000}
            rows={8}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : "description-count"}
            placeholder="Include affected systems, exact error messages, business impact, and when it started."
          />
          <small id="description-count">{characterStats.description}</small>
          {errors.description && (
            <strong id="description-error" className={styles.error}>
              {errors.description}
            </strong>
          )}
        </label>

        <fieldset className={styles.priorityGroup}>
          <legend>Priority</legend>
          {priorities.map((priority) => (
            <label key={priority.value} className={styles.priorityOption}>
              <input
                type="radio"
                name="priority"
                value={priority.value}
                checked={form.priority === priority.value}
                onChange={updateField}
              />
              <span>
                <b>{priority.label}</b>
                <small>{priority.detail}</small>
              </span>
            </label>
          ))}
          {errors.priority && <strong className={styles.error}>{errors.priority}</strong>}
        </fieldset>

        {serverMessage && <div className={styles.alert}>{serverMessage}</div>}
        {createdTicket && (
          <div className={styles.success}>
            Ticket {String(createdTicket.uuid).slice(0, 8)} was created with a {createdTicket.priority} SLA.
          </div>
        )}

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          <FiSend aria-hidden="true" />
          {isSubmitting ? "Submitting" : "Submit Ticket"}
        </button>
      </form>
    </section>
  );
}
