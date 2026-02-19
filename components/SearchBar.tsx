"use client";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "搜索碎片…",
}: SearchBarProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b-2 border-gray-300 focus:border-[#805ad5] focus:outline-none py-2 px-1 text-[#2d3748] placeholder:text-[#a0aec0] transition-colors"
        style={{ boxShadow: "0 1px 0 0 rgba(168, 85, 247, 0.08)" }}
      />
    </div>
  );
}
