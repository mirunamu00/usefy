/**
 * Common story theme styles
 * Used for consistent design across all stories
 */

export const storyTheme = {
  // Containers
  container: "p-8 max-w-[600px] font-sans mx-auto",
  containerCentered: "p-12 text-center font-sans max-w-[500px] mx-auto",

  // Titles
  title:
    "text-[1.75rem] font-bold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2",
  titleLarge: "text-2xl font-semibold text-gray-800 mb-8",
  subtitle: "text-gray-500 mb-6 text-[0.95rem]",

  // Input fields
  input:
    "w-full py-3.5 px-4 text-base border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
  textarea:
    "w-full py-3.5 px-4 text-base border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] font-inherit resize-y focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
  textareaMono:
    "w-full py-3.5 px-4 text-base border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.1)] font-mono resize-y focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",

  // Labels
  label: "block mb-2 font-semibold text-gray-700 text-[0.95rem]",

  // Cards/Boxes
  card: "p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
  cardInfo:
    "p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-[0_2px_8px_rgba(99,102,241,0.1)]",

  // Buttons
  buttonPrimary:
    "px-6 py-3 text-base font-semibold text-white bg-gradient-to-br from-indigo-500 to-purple-600 border-none rounded-lg cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)]",
  buttonSecondary:
    "px-6 py-3 text-base font-semibold text-white bg-gradient-to-br from-pink-400 to-rose-500 border-none rounded-lg cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(244,63,94,0.4)]",
  buttonSuccess:
    "px-6 py-3 text-base font-semibold text-white bg-green-600 border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-green-700",
  buttonDanger:
    "px-6 py-3 text-base font-semibold text-white bg-red-600 border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-red-700",
  buttonNeutral:
    "px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:bg-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
  buttonFull:
    "w-full py-4 px-8 text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:bg-gradient-to-br hover:from-indigo-600 hover:to-purple-700 hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)]",

  // Button groups
  buttonGroup: "flex gap-2",
  buttonGroupFull: "flex gap-2 mb-5",

  // Info boxes
  infoBox: "p-4 bg-yellow-50 border border-yellow-200 rounded-lg",
  infoText: "m-0 text-sm text-yellow-800",

  // Success/Error messages
  messageSuccess:
    "font-semibold text-[0.95rem] p-3 rounded-lg mt-3 text-green-600 bg-gradient-to-br from-green-50 to-green-100",
  messageError:
    "font-semibold text-[0.95rem] p-3 rounded-lg mt-3 text-red-500 bg-gradient-to-br from-red-50 to-red-100",
  messageInfo:
    "text-indigo-600 italic text-[0.95rem] p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mt-3",

  // List items
  listItem:
    "p-4 bg-white border border-gray-200 rounded-lg mb-2 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-200 cursor-pointer hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)] hover:border-indigo-500",

  // Statistics/Counter boxes
  statBox:
    "p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
  statLabel: "text-[0.95rem] mb-2",
  statValue: "text-indigo-600 font-bold text-[1.1rem]",
  statText: "text-gray-700",
  statTextSecondary: "text-gray-500",

  // Gradient box (for emphasis)
  gradientBox:
    "bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 shadow-[0_10px_25px_rgba(99,102,241,0.3)]",

  // Divider
  divider: "mt-4 pt-4 border-t border-gray-200",
};
