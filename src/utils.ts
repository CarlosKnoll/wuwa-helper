let tauriInvoke: any = null;

const loadTauriAPI = async () => {
  if (tauriInvoke) return tauriInvoke;
  
  try {
    const module = await import('@tauri-apps/api/core');
    tauriInvoke = module.invoke;
    return tauriInvoke;
  } catch (e) {
    console.error('Failed to load Tauri API:', e);
    throw new Error('Tauri API not available');
  }
};

export const safeInvoke = async (cmd: string, args?: any) => {
  const invoke = await loadTauriAPI();
  return invoke(cmd, args);
};

export const getElementColor = (e: string) => ({ 
  Spectro: 'text-yellow-400 bg-yellow-400/20', 
  Havoc: 'text-purple-400 bg-purple-400/20', 
  Aero: 'text-cyan-400 bg-cyan-400/20', 
  Electro: 'text-blue-400 bg-blue-400/20', 
  Fusion: 'text-red-400 bg-red-400/20', 
  Glacio: 'text-sky-300 bg-sky-300/20' 
}[e] || 'text-gray-400 bg-gray-400/20');

export const getRarityStars = (r: number) => '★'.repeat(r);

export const getBuildStatusColor = (s: string) => ({ 
  'High investment': 'bg-green-500/20 text-green-400', 
  'Hyperinvested': 'bg-emerald-500/20 text-emerald-400', 
  'Solid investment': 'bg-blue-500/20 text-blue-400', 
  'Medium investment': 'bg-yellow-500/20 text-yellow-400', 
  'Low investment': 'bg-orange-500/20 text-orange-400', 
  'Barely built': 'bg-red-500/20 text-red-400', 
  'Not built': 'bg-gray-500/20 text-gray-400', 
  'Building': 'bg-cyan-500/20 text-cyan-400', 
  'Enough investment': 'bg-teal-500/20 text-teal-400' 
}[s] || 'bg-gray-500/20 text-gray-400');

export const getBuildStatusPriority = (s: string) => ({ 
  'Hyperinvested': 1, 
  'High investment': 2, 
  'Solid investment': 3, 
  'Enough investment': 4, 
  'Building': 5, 
  'Medium investment': 6, 
  'Low investment': 7, 
  'Barely built': 8, 
  'Not built': 9 
}[s] || 10);