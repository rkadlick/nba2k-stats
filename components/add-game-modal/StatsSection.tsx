"use client";

import { useFormContext } from "react-hook-form";

export function StatsSection() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const fgAttempted = watch("fg_attempted");
  const threesAttempted = watch("threes_attempted");
  const ftAttempted = watch("ft_attempted");

  // Field config
  const fields = [
    { name: "minutes", label: "Minutes", step: 0.1 },
    { name: "points", label: "Points" },
    { name: "rebounds", label: "Rebounds" },
    { name: "assists", label: "Assists" },
    { name: "steals", label: "Steals" },
    { name: "blocks", label: "Blocks" },
    { name: "turnovers", label: "Turnovers" },
    {
      name: "fg_made",
      label: "FG Made",
      validate: (val: number | undefined) =>
        val === undefined ||
        val <= (fgAttempted ?? val) ||
        "FG made cannot exceed attempts",
    },
    {
      name: "fg_attempted",
      label: "FG Attempted",
    },
    {
      name: "threes_made",
      label: "3PT Made",
      validate: (val: number | undefined) =>
        val === undefined ||
        val <= (threesAttempted ?? val) ||
        "3PT made cannot exceed attempts",
    },
    {
      name: "threes_attempted",
      label: "3PT Attempted",
      validate: (val: number | undefined) =>
        val === undefined ||
        val >= (watch("threes_made") ?? 0) ||
        "3PT attempts must be ≥ 3PT made",
    },
    {
      name: "ft_made",
      label: "FT Made",
      validate: (val: number | undefined) =>
        val === undefined ||
        val <= (ftAttempted ?? val) ||
        "FT made cannot exceed attempts",
    },
    {
      name: "ft_attempted",
      label: "FT Attempted",
      validate: (val: number | undefined) =>
        val === undefined ||
        val >= (watch("ft_made") ?? 0) ||
        "FT attempts must be ≥ FT made",
    },
    { name: "offensive_rebounds", label: "Offensive Rebounds" },
    { name: "fouls", label: "Fouls" },
    { name: "plus_minus", label: "+/−" }
  ] as const;

  return (
    <section className="border-t border-gray-200 pt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Statistics
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type="number"
              step={("step" in field ? field.step : 1) ?? 1}
              {...register(field.name, {
                valueAsNumber: true,
                min: { value: 0, message: "≥ 0" },
                validate: "validate" in field ? field.validate : undefined,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {errors[field.name] && (
              <p className="text-xs text-red-600">
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}