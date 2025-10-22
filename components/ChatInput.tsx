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
      className="flex w-full items-center gap-3 border-b-2 border-white/60 pb-3"
    >
      <input
        className="flex-1 bg-transparent text-base text-white placeholder:text-white/50 outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="submit"
        className="text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:text-white/80 disabled:cursor-not-allowed disabled:text-white/40"
        disabled={disabled}
      >
        Enviar
      </button>
    </form>
  );
}
