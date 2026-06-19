import { EventForm } from "@/components/admin/EventForm";
import { createEventAction } from "./actions";

export const metadata = { title: "Новое событие — Админка" };

export default function NewEventPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl font-medium text-text-primary">
        Новое событие
      </h1>
      <EventForm mode="create" onSubmitAction={createEventAction} />
    </div>
  );
}
