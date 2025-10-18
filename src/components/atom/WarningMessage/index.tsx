import WarningIcon from "../../../assets/img/warning-icon.svg?react";

type WarningMessageProps = {
  message: string;
  show: boolean;
};

const WarningMessage = ({ message, show }: WarningMessageProps) => {
  const linkify = (text: string) => {
    // Regex pattern to match a more complete and strict URL structure
    const urlRegex = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    return text.split(" ").map((part, index) =>
      urlRegex.test(part) ? (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {" "}
          URL
        </a>
      ) : (
        " " + part
      )
    );
  };
  return show ? (
    <div className="flex gap-5 rounded-2xl bg-yellow-100 p-6 font-inter text-sm font-normal dark:bg-yellow-900/20 dark:text-yellow-200">
      <span className="mt-0.5">
        <WarningIcon />
      </span>
      <span>{linkify(message)}</span>
    </div>
  ) : null;
};

export default WarningMessage;
