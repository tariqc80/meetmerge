interface SubmissionCounterProps {
  count: number;
}

export function SubmissionCounter({ count }: SubmissionCounterProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
        {count}
      </span>
      {count === 1 ? "person" : "people"} submitted
    </div>
  );
}
