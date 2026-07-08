with open('src/components/StatusCheckSection.tsx', 'rb') as f:
    content = f.read()

# Replace the corrupted part
# We will just find "setSelectedYear(yr);" and "{/* Status Filter Tabs / Pills */}"
import re
start_idx = content.find(b"setSelectedYear(yr);")
end_idx = content.find(b"{/* Status Filter Tabs / Pills */}")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx + len(b"setSelectedYear(yr);")] + b"""
                                setStatusFilter('\xe0\xb8\x97\xe0\xb8\xb1\xe0\xb9\x89\xe0\xb8\x87\xe0\xb8\xab\xe0\xb8\xa1\xe0\xb8\x94');
                              }}
                              className={`px-3 py-1.5 text-xs font-sans font-bold rounded-lg border transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-mangosteen text-white border-mangosteen shadow-xs ring-2 ring-mangosteen/20' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <span>{yr}</span>
                              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {yrCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    """ + content[end_idx:]
    with open('src/components/StatusCheckSection.tsx', 'wb') as f:
        f.write(new_content)
    print("Fixed!")
else:
    print("Could not find boundaries")
