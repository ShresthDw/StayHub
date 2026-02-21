const InputField = ({
    label,
    name,
    type = 'text',
    required = true,
    placeholder,
    value,
    onChange,
    isTextArea = false,
    readOnly = false
}) => {
    const cls = `mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`;
    const props = { type, name, value: value || '', onChange, placeholder, readOnly, className: cls, required };

    return (
        <div className="text-gray-700 dark:text-gray-300">
            <label className="text-sm font-medium">
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {isTextArea ? <textarea rows="3" {...props} /> : <input {...props} />}
        </div>
    );
};

export default InputField;
