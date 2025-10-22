import { FormEvent } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({ value, onChange, onSubmit, disabled, placeholder }: ChatInputProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled) {
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full gap-2 rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur"
    >
      <input
        className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-500 px-4 py-2 text-base font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={disabled}
      >
        Enviar
      </button>
    </form>
  );
}
