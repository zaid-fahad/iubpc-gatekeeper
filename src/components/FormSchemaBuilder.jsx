import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Modular component for building and editing dynamic custom questionnaire fields.
 */
export function FormSchemaBuilder({ schema = [], onUpdateSchema, isLightMode = false }) {
  const addField = () => {
    const newId = `f_${Date.now()}`;
    const newField = {
      id: newId,
      name: `field_${schema.length + 1}`,
      label: 'New Question',
      type: 'text',
      required: false,
      options: ['Option 1', 'Option 2']
    };
    onUpdateSchema([...schema, newField]);
  };

  const removeField = (fieldId) => {
    onUpdateSchema(schema.filter(f => f.id !== fieldId));
  };

  const updateField = (fieldId, key, value) => {
    onUpdateSchema(schema.map(f => f.id === fieldId ? { ...f, [key]: value } : f));
  };

  const addOption = (fieldId) => {
    onUpdateSchema(schema.map(f => {
      if (f.id === fieldId) {
        const opts = f.options || [];
        return { ...f, options: [...opts, `Option ${opts.length + 1}`] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId, optIdx, val) => {
    onUpdateSchema(schema.map(f => {
      if (f.id === fieldId) {
        const opts = [...(f.options || [])];
        opts[optIdx] = val;
        return { ...f, options: opts };
      }
      return f;
    }));
  };

  const removeOption = (fieldId, optIdx) => {
    onUpdateSchema(schema.map(f => {
      if (f.id === fieldId) {
        const opts = (f.options || []).filter((_, i) => i !== optIdx);
        return { ...f, options: opts };
      }
      return f;
    }));
  };

  const moveField = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= schema.length) return;
    const newSchema = [...schema];
    const temp = newSchema[index];
    newSchema[index] = newSchema[targetIdx];
    newSchema[targetIdx] = temp;
    onUpdateSchema(newSchema);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className={`text-xs font-bold ${isLightMode ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>
          Custom Registration Questionnaire Fields
        </h4>
        <button
          type="button"
          onClick={addField}
          className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-purple-500 transition-all shadow-xs"
        >
          <Plus size={14} />
          <span>Add Question</span>
        </button>
      </div>

      <div className="space-y-3">
        {schema.map((field, idx) => (
          <div key={field.id || idx} className={`p-4 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'} space-y-3`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveField(idx, -1)}
                  className="p-1 hover:text-white disabled:opacity-30"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  disabled={idx === schema.length - 1}
                  onClick={() => moveField(idx, 1)}
                  className="p-1 hover:text-white disabled:opacity-30"
                >
                  <ChevronDown size={16} />
                </button>
                <span className="text-xs font-mono font-bold ml-1">#{idx + 1}</span>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, 'label', e.target.value)}
                  placeholder="Question Label..."
                  className={`w-full px-3 py-1.5 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'} text-xs focus:outline-none focus:border-purple-500`}
                />
              </div>

              <select
                value={field.type}
                onChange={(e) => updateField(field.id, 'type', e.target.value)}
                className={`px-3 py-1.5 rounded-xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'} text-xs focus:outline-none focus:border-purple-500`}
              >
                <option value="text">Text Input</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="select">Dropdown Select</option>
                <option value="textarea">Textarea</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, 'required', e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Required</span>
              </label>

              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Remove Question"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* OPTIONS BUILDER FOR SELECT TYPE */}
            {field.type === 'select' && (
              <div className="pl-6 pt-2 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Dropdown Options</span>
                  <button
                    type="button"
                    onClick={() => addOption(field.id)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold"
                  >
                    + Add Option
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(field.options || []).map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(field.id, oIdx, e.target.value)}
                        className="bg-transparent text-white text-xs border-none focus:outline-none w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(field.id, oIdx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
