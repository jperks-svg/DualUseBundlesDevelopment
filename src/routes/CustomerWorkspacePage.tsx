// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { dataSources } from '../data/sources';
import { fieldMatrix } from '../data/fields';
import { guardPolicies } from '../data/guardPolicies';
import { securityDetections as secDetData } from '../data/securityDetections';
import { observabilityDetections as obsDetData } from '../data/observabilityDetections';
import { routingBlueprints } from '../data/routing';
import { calculateFieldReduction, calculateCostSavings } from '../utils/costCalc';
import { getProfilesSync, saveProfilesToKV, loadProfilesFromKV, CustomerProfile, CustomSource, CustomField, CustomSearch } from '../utils/customerStore';
import { validateKql, parseKqlFields } from '../utils/kqlParser';

const card: React.CSSProperties = {
  background: 'var(--cds-color-bg)', border: '1px solid var(--cds-color-border-subtle)',
  borderRadius: 'var(--cds-radius-lg)', padding: 20, boxShadow: 'var(--cds-shadow-sm)',
};
const tag = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--cds-radius-sm)',
  fontSize: 'var(--cds-font-size-xs)', fontWeight: 500, background: bg, color,
});
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px', border: 'none', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, cursor: 'pointer',
  background: 'var(--cds-brand-teal)', color: '#fff',
};
const btnSecondary: React.CSSProperties = {
  padding: '8px 16px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', fontWeight: 500, cursor: 'pointer',
  background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)',
};
const btnDanger: React.CSSProperties = {
  ...btnSecondary, borderColor: 'var(--cds-color-danger)', color: 'var(--cds-color-danger)',
};
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--cds-color-border)', borderRadius: 'var(--cds-radius-md)',
  fontSize: 'var(--cds-font-size-sm)', background: 'var(--cds-color-bg)', color: 'var(--cds-color-fg)', width: '100%',
};

const catalogSources = dataSources.flatMap((c: any) => c.sources).filter((s: any) => s.status === 'available').sort((a: any, b: any) => a.name.localeCompare(b.name));

function generateCombinedPackYaml(sourceIds: string[], customerName: string, customDrops?: Record<string, Set<string>>, customSources?: CustomSource[]): string {
  let yaml = '';
  yaml += `# ============================================================\n`;
  yaml += `# Combined Cribl Stream Pipeline Pack\n`;
  yaml += `# Project: ${customerName}\n`;
  yaml += `# Sources: ${sourceIds.length}\n`;
  yaml += `# ============================================================\n\n`;

  sourceIds.forEach(sid => {
    const customSrc = customSources?.find(cs => cs.id === sid);
    const fields = customSrc ? customSrc.fields : ((fieldMatrix as any)[sid] || []);
    const source = customSrc ? { name: customSrc.name } : catalogSources.find(s => s.id === sid);
    const userDrops = customDrops?.[sid];
    const droppable = userDrops && userDrops.size > 0
      ? [...userDrops]
      : fields.filter(f => f.canDrop === 'Yes').map(f => f.field);
    const maskable = fields.filter(f => f.guardAction === 'Mask').map(f => f.field);
    const redactable = fields.filter(f => f.guardAction === 'Redact').map(f => f.field);

    yaml += `# --- ${source?.name || sid} ---\n`;
    yaml += `- id: ${sid}_optimization\n`;
    yaml += `  name: "${source?.name || sid} - Optimization"\n`;
    yaml += `  disabled: false\n`;
    yaml += `  functions:\n`;

    if (droppable.length > 0) {
      yaml += `    - id: drop_fields\n`;
      yaml += `      filter: "true"\n`;
      yaml += `      conf:\n`;
      yaml += `        remove:\n`;
      droppable.forEach(f => { yaml += `          - ${f}\n`; });
      yaml += `      description: "Drop ${droppable.length} low-value fields"\n`;
    }
    if (maskable.length > 0) {
      yaml += `    - id: guard_mask\n`;
      yaml += `      filter: "true"\n`;
      yaml += `      conf:\n`;
      yaml += `        rules:\n`;
      maskable.forEach(f => { yaml += `          - fieldName: ${f}\n            method: mask\n`; });
      yaml += `      description: "Mask ${maskable.length} PII fields"\n`;
    }
    if (redactable.length > 0) {
      yaml += `    - id: guard_redact\n`;
      yaml += `      filter: "true"\n`;
      yaml += `      conf:\n`;
      yaml += `        rules:\n`;
      redactable.forEach(f => { yaml += `          - fieldName: ${f}\n            method: redact\n`; });
      yaml += `      description: "Redact ${redactable.length} secret fields"\n`;
    }
    yaml += `    - id: route_tag\n`;
    yaml += `      filter: "true"\n`;
    yaml += `      conf:\n`;
    yaml += `        add:\n`;
    yaml += `          - name: __cribl_route\n`;
    yaml += `            value: "'lake'"\n\n`;
  });

  return yaml;
}

export default function CustomerWorkspacePage() {
  const [profiles, setProfiles] = useState<CustomerProfile[]>(() => getProfilesSync());
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    const cached = getProfilesSync();
    return cached.length > 0 ? cached[0].id : null;
  });
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [editNotes, setEditNotes] = useState(false);
  const [showFieldTuning, setShowFieldTuning] = useState(false);
  const [tuningSource, setTuningSource] = useState<string | null>(null);
  const [droppedFields, setDroppedFields] = useState<Record<string, Set<string>>>(() => {
    // Hydrate from active profile if available
    const cached = getProfilesSync();
    const active = cached[0];
    if (active?.droppedFields) {
      const result: Record<string, Set<string>> = {};
      for (const [k, v] of Object.entries(active.droppedFields)) {
        result[k] = new Set(v);
      }
      return result;
    }
    return {};
  });
  const [fieldFilter, setFieldFilter] = useState<'all' | 'droppable' | 'security' | 'observability'>('all');

  // Custom source state
  const [showAddCustomSource, setShowAddCustomSource] = useState(false);
  const [editingCustomSourceId, setEditingCustomSourceId] = useState<string | null>(null);
  const [customSourceName, setCustomSourceName] = useState('');
  const [customSourceVendor, setCustomSourceVendor] = useState('');
  const [customSourceDesc, setCustomSourceDesc] = useState('');
  const [customSourceFields, setCustomSourceFields] = useState<CustomField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldDesc, setNewFieldDesc] = useState('');

  // Custom search state
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchDesc, setSearchDesc] = useState('');
  const [searchCategory, setSearchCategory] = useState<'security' | 'observability' | 'both'>('security');
  const [searchSourceId, setSearchSourceId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchValidation, setSearchValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[]; referencedFields: string[] } | null>(null);

  // On mount: refresh from KV store (async) to pick up data from prior sessions
  useEffect(() => {
    loadProfilesFromKV().then(kvProfiles => {
      if (kvProfiles.length > 0) {
        setProfiles(kvProfiles);
        const firstId = kvProfiles[0].id;
        if (!activeProfileId) setActiveProfileId(firstId);
        // Hydrate droppedFields from the active profile
        const active = kvProfiles.find(p => p.id === (activeProfileId || firstId));
        if (active?.droppedFields) {
          const hydrated: Record<string, Set<string>> = {};
          for (const [k, v] of Object.entries(active.droppedFields)) {
            hydrated[k] = new Set(v);
          }
          setDroppedFields(hydrated);
        }
      }
    });
  }, []);

  // Persist whenever profiles change — writes to in-memory cache + KV + localStorage
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setSaveStatus('Saving...');
    saveProfilesToKV(profiles).then(() => {
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }).catch(() => {
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(null), 3000);
    });
  }, [profiles]);

  // Hydrate droppedFields when switching profiles
  useEffect(() => {
    const profile = profiles.find(p => p.id === activeProfileId);
    if (profile?.droppedFields) {
      const hydrated: Record<string, Set<string>> = {};
      for (const [k, v] of Object.entries(profile.droppedFields)) {
        hydrated[k] = new Set(v);
      }
      setDroppedFields(hydrated);
    } else {
      setDroppedFields({});
    }
  }, [activeProfileId]);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  const allSources = useMemo(() => {
    const custom = (activeProfile?.customSources || []).map(cs => ({
      id: cs.id, name: cs.name, vendor: cs.vendor, status: 'available', isCustom: true,
    }));
    return [...catalogSources, ...custom].sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [activeProfile]);

  function handleCreate() {
    if (!newName.trim()) return;
    const newProfile: CustomerProfile = {
      id: `proj_${Date.now().toString(36)}`,
      name: newName.trim(),
      company: newCompany.trim(),
      sourceIds: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setNewName(''); setNewCompany(''); setShowCreate(false);
  }

  function handleDelete(id: string) {
    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== id);
      setActiveProfileId(updated[0]?.id || null);
      return updated;
    });
  }

  function toggleSource(sourceId: string) {
    if (!activeProfile) return;
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      const sourceIds = p.sourceIds.includes(sourceId)
        ? p.sourceIds.filter(s => s !== sourceId)
        : [...p.sourceIds, sourceId];
      return { ...p, sourceIds, updatedAt: new Date().toISOString() };
    }));
  }

  function handleNotesChange(notes: string) {
    if (!activeProfile) return;
    setProfiles(prev => prev.map(p =>
      p.id === activeProfile.id ? { ...p, notes, updatedAt: new Date().toISOString() } : p
    ));
  }

  // Sync droppedFields into the active profile for persistence
  function persistDroppedFields(newDropped: Record<string, Set<string>>) {
    setDroppedFields(newDropped);
    if (!activeProfile) return;
    const serialized: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(newDropped)) {
      if (v.size > 0) serialized[k] = [...v];
    }
    setProfiles(prev => prev.map(p =>
      p.id === activeProfile.id ? { ...p, droppedFields: serialized, updatedAt: new Date().toISOString() } : p
    ));
  }

  // Custom source management
  function handleAddCustomSource() {
    if (!activeProfile || !customSourceName.trim() || customSourceFields.length === 0) return;
    const newSource: CustomSource = {
      id: `custom_${Date.now().toString(36)}`,
      name: customSourceName.trim(),
      vendor: customSourceVendor.trim() || 'Custom',
      description: customSourceDesc.trim(),
      fields: customSourceFields,
      createdAt: new Date().toISOString(),
    };
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      const customSources = [...(p.customSources || []), newSource];
      const sourceIds = [...p.sourceIds, newSource.id];
      return { ...p, customSources, sourceIds, updatedAt: new Date().toISOString() };
    }));
    setCustomSourceName(''); setCustomSourceVendor(''); setCustomSourceDesc('');
    setCustomSourceFields([]); setShowAddCustomSource(false);
  }

  function handleAddField() {
    if (!newFieldName.trim()) return;
    setCustomSourceFields(prev => [...prev, {
      field: newFieldName.trim(),
      description: newFieldDesc.trim() || newFieldName.trim(),
      canDrop: 'Sometimes',
      securitySiem: 'No',
      observability: 'No',
    }]);
    setNewFieldName(''); setNewFieldDesc('');
  }

  function removeCustomField(idx: number) {
    setCustomSourceFields(prev => prev.filter((_, i) => i !== idx));
  }

  function removeCustomSource(sourceId: string) {
    if (!activeProfile) return;
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      return {
        ...p,
        customSources: (p.customSources || []).filter(s => s.id !== sourceId),
        sourceIds: p.sourceIds.filter(id => id !== sourceId),
        updatedAt: new Date().toISOString(),
      };
    }));
  }

  function startEditCustomSource(sourceId: string) {
    const cs = activeProfile?.customSources?.find(s => s.id === sourceId);
    if (!cs) return;
    setEditingCustomSourceId(sourceId);
    setCustomSourceName(cs.name);
    setCustomSourceVendor(cs.vendor);
    setCustomSourceDesc(cs.description);
    setCustomSourceFields([...cs.fields]);
    setShowAddCustomSource(true);
  }

  function handleSaveCustomSource() {
    if (!activeProfile || !customSourceName.trim() || customSourceFields.length === 0) return;
    if (editingCustomSourceId) {
      setProfiles(prev => prev.map(p => {
        if (p.id !== activeProfile.id) return p;
        const customSources = (p.customSources || []).map(cs => {
          if (cs.id !== editingCustomSourceId) return cs;
          return { ...cs, name: customSourceName.trim(), vendor: customSourceVendor.trim() || 'Custom', description: customSourceDesc.trim(), fields: customSourceFields };
        });
        return { ...p, customSources, updatedAt: new Date().toISOString() };
      }));
      setEditingCustomSourceId(null);
    } else {
      handleAddCustomSource();
      return;
    }
    setCustomSourceName(''); setCustomSourceVendor(''); setCustomSourceDesc('');
    setCustomSourceFields([]); setShowAddCustomSource(false);
  }

  // Custom search management
  function handleValidateSearch(query: string) {
    setSearchQuery(query);
    if (query.trim()) {
      const result = validateKql(query);
      setSearchValidation(result);
    } else {
      setSearchValidation(null);
    }
  }

  function handleAddSearch() {
    if (!activeProfile || !searchName.trim() || !searchQuery.trim() || !searchSourceId) return;
    const validation = validateKql(searchQuery);
    if (!validation.valid) return;
    const newSearch: CustomSearch = {
      id: `search_${Date.now().toString(36)}`,
      name: searchName.trim(),
      description: searchDesc.trim(),
      category: searchCategory,
      sourceId: searchSourceId,
      query: searchQuery.trim(),
      referencedFields: validation.referencedFields,
      createdAt: new Date().toISOString(),
    };
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      return { ...p, customSearches: [...(p.customSearches || []), newSearch], updatedAt: new Date().toISOString() };
    }));
    setSearchName(''); setSearchDesc(''); setSearchQuery(''); setSearchSourceId('');
    setSearchCategory('security'); setSearchValidation(null); setShowAddSearch(false);
  }

  function removeCustomSearch(searchId: string) {
    if (!activeProfile) return;
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfile.id) return p;
      return { ...p, customSearches: (p.customSearches || []).filter(s => s.id !== searchId), updatedAt: new Date().toISOString() };
    }));
  }

  // Get all custom searches for a given source, plus their field impacts
  const customSearchImpact = useMemo(() => {
    if (!activeProfile || !tuningSource) return [];
    const searches = (activeProfile.customSearches || []).filter(s => s.sourceId === tuningSource);
    const dropped = droppedFields[tuningSource] || new Set();
    return searches.map(s => {
      const missing = s.referencedFields.filter(f => dropped.has(f));
      return { ...s, missing, broken: missing.length > 0 };
    });
  }, [activeProfile, tuningSource, droppedFields]);

  function toggleFieldDrop(sourceId: string, fieldName: string) {
    const current = new Set(droppedFields[sourceId] || []);
    current.has(fieldName) ? current.delete(fieldName) : current.add(fieldName);
    persistDroppedFields({ ...droppedFields, [sourceId]: current });
  }

  function dropAllRecommended(sourceId: string) {
    const customSrc = activeProfile?.customSources?.find(cs => cs.id === sourceId);
    const fields = customSrc ? customSrc.fields : ((fieldMatrix as any)[sourceId] || []);
    const droppable = fields.filter((f: any) => f.canDrop === 'Yes').map((f: any) => f.field);
    persistDroppedFields({ ...droppedFields, [sourceId]: new Set(droppable) });
  }

  function keepAll(sourceId: string) {
    persistDroppedFields({ ...droppedFields, [sourceId]: new Set() });
  }

  // Field tuning impact for active tuning source
  const tuningImpact = useMemo(() => {
    if (!tuningSource) return null;
    const customSrc = activeProfile?.customSources?.find(cs => cs.id === tuningSource);
    const fields = customSrc ? customSrc.fields : ((fieldMatrix as any)[tuningSource] || []);
    const dropped = droppedFields[tuningSource] || new Set();
    const secDets: any[] = (secDetData as any)[tuningSource] || [];
    const obsDets: any[] = (obsDetData as any)[tuningSource] || [];

    const secImpact = secDets.map((d: any) => {
      const required = new Set(d.requiredFields || []);
      const missing = [...required].filter((f: string) => dropped.has(f));
      return { ...d, missing, broken: missing.length > 0, coverage: required.size > 0 ? Math.round(((required.size - missing.length) / required.size) * 100) : 100 };
    });
    const obsImpact = obsDets.map((d: any) => {
      const required = new Set(d.requiredFields || []);
      const missing = [...required].filter((f: string) => dropped.has(f));
      return { ...d, missing, broken: missing.length > 0, coverage: required.size > 0 ? Math.round(((required.size - missing.length) / required.size) * 100) : 100 };
    });

    // Custom search impact — re-parse query to catch fields that may have been missed at creation time
    const searches = (activeProfile?.customSearches || []).filter(s => s.sourceId === tuningSource);
    const searchImpact = searches.map(s => {
      const liveFields = parseKqlFields(s.query);
      const allRefFields = [...new Set([...s.referencedFields, ...liveFields])];
      const missing = allRefFields.filter(f => dropped.has(f));
      return { ...s, referencedFields: allRefFields, missing, broken: missing.length > 0 };
    });

    const brokenDetections = [...secImpact, ...obsImpact].filter(d => d.broken).length;
    const brokenSearches = searchImpact.filter(s => s.broken).length;
    const brokenCount = brokenDetections + brokenSearches;
    const totalDets = secImpact.length + obsImpact.length;
    const totalItems = totalDets + searches.length;
    return { secImpact, obsImpact, searchImpact, brokenCount, healthyCount: totalItems - brokenCount, totalDets, totalItems, droppedCount: dropped.size, totalFields: fields.length };
  }, [tuningSource, droppedFields, activeProfile]);

  // Aggregate analysis for active profile
  const analysis = useMemo(() => {
    if (!activeProfile || activeProfile.sourceIds.length === 0) return null;

    let totalFields = 0, totalDroppable = 0, totalGuard = 0, totalSecRequired = 0, totalObsFields = 0;
    let totalSecDetections = 0, totalObsDetections = 0;
    const coverageGaps: string[] = [];
    const allDestinations = new Set<string>();
    const sourceAnalyses: any[] = [];

    activeProfile.sourceIds.forEach(sid => {
      const customSrc = activeProfile.customSources?.find(cs => cs.id === sid);
      const fields = customSrc ? customSrc.fields : ((fieldMatrix as any)[sid] || []);
      const secDets = (secDetData as any)[sid] || [];
      const obsDets = (obsDetData as any)[sid] || [];
      const source = allSources.find(s => s.id === sid);
      const guard = (guardPolicies as any)[sid];

      const droppable = fields.filter(f => f.canDrop === 'Yes').length;
      const secReq = fields.filter(f => f.securitySiem === 'Yes').length;
      const obsReq = fields.filter(f => f.observability === 'Yes' || f.observability === 'Sometimes').length;
      const guardCount = fields.filter(f => f.guardAction && f.guardAction !== 'None').length;

      totalFields += fields.length;
      totalDroppable += droppable;
      totalGuard += guardCount;
      totalSecRequired += secReq;
      totalObsFields += obsReq;
      const customSecCount = (activeProfile.customSearches || []).filter(s => s.sourceId === sid && (s.category === 'security' || s.category === 'both')).length;
      const customObsCount = (activeProfile.customSearches || []).filter(s => s.sourceId === sid && (s.category === 'observability' || s.category === 'both')).length;
      totalSecDetections += secDets.length + customSecCount;
      totalObsDetections += obsDets.length + customObsCount;

      source?.destinations?.forEach((d: string) => allDestinations.add(d));

      const customSecSearches = (activeProfile.customSearches || []).filter(s => s.sourceId === sid && (s.category === 'security' || s.category === 'both'));
      const customObsSearches = (activeProfile.customSearches || []).filter(s => s.sourceId === sid && (s.category === 'observability' || s.category === 'both'));
      if (secDets.length === 0 && customSecSearches.length === 0) coverageGaps.push(`${source?.name || sid}: No security detections`);
      if (obsDets.length === 0 && customObsSearches.length === 0) coverageGaps.push(`${source?.name || sid}: No observability detections`);

      sourceAnalyses.push({
        id: sid,
        name: source?.name || sid,
        fields: fields.length,
        droppable,
        secDetections: secDets.length,
        obsDetections: obsDets.length,
        guardCount,
        dropPct: fields.length > 0 ? Math.round(droppable / fields.length * 100) : 0,
      });
    });

    const fieldReduction = {
      totalFields, droppableFields: totalDroppable, securityRequiredFields: totalSecRequired,
      observabilityFields: totalObsFields, guardProtectedFields: totalGuard, maskableFields: totalGuard,
    };
    const costResult = calculateCostSavings(5000, 800, 3.50, fieldReduction);

    return {
      totalFields, totalDroppable, totalGuard, totalSecRequired, totalObsFields,
      totalSecDetections, totalObsDetections, coverageGaps,
      destinations: [...allDestinations], sourceAnalyses, costResult, fieldReduction,
    };
  }, [activeProfile]);

  // Correlation coverage between selected sources
  const correlationCoverage = useMemo(() => {
    if (!activeProfile || activeProfile.sourceIds.length < 2) return [];
    const fieldSets: Record<string, Set<string>> = {};
    activeProfile.sourceIds.forEach(sid => {
      const fields = (fieldMatrix as any)[sid] || [];
      fieldSets[sid] = new Set(fields.filter(f => f.securitySiem === 'Yes').map(f => f.field));
    });

    const sharedFields: { field: string; sources: string[] }[] = [];
    const allFields = new Set<string>();
    Object.values(fieldSets).forEach(s => s.forEach(f => allFields.add(f)));

    allFields.forEach(field => {
      const sources = activeProfile.sourceIds.filter(sid => fieldSets[sid]?.has(field));
      if (sources.length > 1) {
        sharedFields.push({ field, sources: sources.map(sid => allSources.find(s => s.id === sid)?.name || sid) });
      }
    });

    return sharedFields.sort((a, b) => b.sources.length - a.sources.length).slice(0, 20);
  }, [activeProfile]);

  function downloadCombinedPack() {
    if (!activeProfile || activeProfile.sourceIds.length === 0) return;
    const hasCustomDrops = Object.values(droppedFields).some(s => s.size > 0);
    const yaml = generateCombinedPackYaml(activeProfile.sourceIds, activeProfile.name, hasCustomDrops ? droppedFields : undefined, activeProfile.customSources);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProfile.company || activeProfile.name}-combined-pipeline.yml`.toLowerCase().replace(/\s+/g, '-');
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 600, color: 'var(--cds-color-fg)', marginBottom: 8 }}>Project Workspace</h2>
          {saveStatus && (
            <span style={{ fontSize: 'var(--cds-font-size-xs)', color: saveStatus === 'Save failed' ? 'var(--cds-color-danger)' : 'var(--cds-brand-teal)', fontWeight: 500 }}>
              {saveStatus}
            </span>
          )}
        </div>
        <p style={{ fontSize: 'var(--cds-font-size-base)', color: 'var(--cds-color-fg-muted)', lineHeight: 1.6 }}>
          Build project-specific views across multiple sources. Aggregate reduction potential, export combined packs, and identify correlation coverage gaps.
        </p>
      </div>

      {/* Profile selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        {profiles.map(p => (
          <button key={p.id} onClick={() => setActiveProfileId(p.id)} style={{
            padding: '8px 16px', borderRadius: 'var(--cds-radius-md)', cursor: 'pointer',
            fontSize: 'var(--cds-font-size-sm)', fontWeight: activeProfileId === p.id ? 600 : 400,
            border: activeProfileId === p.id ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)',
            background: activeProfileId === p.id ? 'var(--cds-color-bg-subtle)' : 'var(--cds-color-bg)',
            color: activeProfileId === p.id ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
          }}>
            {p.name} {p.company && <span style={{ opacity: 0.6 }}>({p.company})</span>}
          </button>
        ))}
        <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, padding: '8px 14px' }}>+ New Project</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ ...card, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Project Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Q3 Optimization" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Organization</label>
            <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>
          <button onClick={handleCreate} style={btnPrimary}>Create</button>
          <button onClick={() => setShowCreate(false)} style={btnSecondary}>Cancel</button>
        </div>
      )}

      {!activeProfile && !showCreate && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--cds-color-fg-muted)' }}>
          <p style={{ fontSize: 'var(--cds-font-size-lg)', marginBottom: 12 }}>No projects yet</p>
          <p style={{ fontSize: 'var(--cds-font-size-sm)' }}>Create a project to start building multi-source analysis</p>
        </div>
      )}

      {activeProfile && (
        <div>
          {/* Source selector */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, margin: 0 }}>
                Data Sources ({activeProfile.sourceIds.length} selected)
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowAddCustomSource(true)} style={{ ...btnPrimary, padding: '6px 12px', fontSize: 'var(--cds-font-size-xs)' }}>+ Add Custom Source</button>
                <button onClick={() => handleDelete(activeProfile.id)} style={btnDanger}>Delete Project</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {allSources.map((s: any) => {
                const selected = activeProfile.sourceIds.includes(s.id);
                const isCustom = s.isCustom;
                return (
                  <label key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
                    borderRadius: 'var(--cds-radius-md)',
                    background: selected ? 'var(--cds-color-accent-subtle)' : 'var(--cds-color-bg-subtle)',
                    border: selected ? (isCustom ? '1px solid #a855f7' : '1px solid var(--cds-brand-teal)') : '1px solid transparent',
                  }}>
                    <input type="checkbox" checked={selected} onChange={() => toggleSource(s.id)}
                      style={{ width: 14, height: 14, accentColor: isCustom ? '#a855f7' : 'var(--cds-brand-teal)' }} />
                    <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg)' }}>
                      {s.name}
                      {isCustom && <span style={{ marginLeft: 4, fontSize: 9, color: '#a855f7', fontWeight: 600 }}>CUSTOM</span>}
                    </span>
                    {isCustom && selected && (
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEditCustomSource(s.id); }}
                          style={{ fontSize: 10, color: '#a855f7', cursor: 'pointer' }} title="Edit fields">&#9998;</span>
                        <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeCustomSource(s.id); }}
                          style={{ fontSize: 10, color: 'var(--cds-color-danger)', cursor: 'pointer' }} title="Remove custom source">&#x2715;</span>
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Add Custom Source Modal */}
          {showAddCustomSource && (
            <div style={{ ...card, marginBottom: 24, border: '2px solid #a855f7' }}>
              <h4 style={{ fontSize: 'var(--cds-font-size-base)', fontWeight: 600, margin: '0 0 16px', color: '#a855f7' }}>{editingCustomSourceId ? 'Edit Custom Source' : 'Add Custom Source'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Source Name *</label>
                  <input value={customSourceName} onChange={e => setCustomSourceName(e.target.value)} placeholder="e.g. Custom App Logs" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Vendor</label>
                  <input value={customSourceVendor} onChange={e => setCustomSourceVendor(e.target.value)} placeholder="e.g. Internal" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                  <input value={customSourceDesc} onChange={e => setCustomSourceDesc(e.target.value)} placeholder="Brief description" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 8 }}>
                  Fields ({customSourceFields.length} defined)
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={newFieldName} onChange={e => setNewFieldName(e.target.value)} placeholder="Field name (e.g. src_ip)"
                    style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') handleAddField(); }} />
                  <input value={newFieldDesc} onChange={e => setNewFieldDesc(e.target.value)} placeholder="Description (optional)"
                    style={{ ...inputStyle, flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') handleAddField(); }} />
                  <button onClick={handleAddField} style={{ ...btnSecondary, padding: '6px 12px', whiteSpace: 'nowrap' }}>+ Add Field</button>
                </div>
                {customSourceFields.length > 0 && (
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-md)' }}>
                    {customSourceFields.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                        <code style={{ fontSize: 11, fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-accent)', flex: 1 }}>{f.field}</code>
                        <span style={{ fontSize: 10, color: 'var(--cds-color-fg-muted)', flex: 1 }}>{f.description}</span>
                        <select value={f.canDrop} onChange={e => {
                          const updated = [...customSourceFields];
                          updated[i] = { ...updated[i], canDrop: e.target.value as any };
                          setCustomSourceFields(updated);
                        }} style={{ fontSize: 10, padding: '2px 4px', borderRadius: 3 }}>
                          <option value="Yes">Droppable</option>
                          <option value="No">Required</option>
                          <option value="Sometimes">Sometimes</option>
                        </select>
                        <span onClick={() => removeCustomField(i)} style={{ cursor: 'pointer', color: 'var(--cds-color-danger)', fontSize: 12 }}>&#x2715;</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveCustomSource} disabled={!customSourceName.trim() || customSourceFields.length === 0}
                  style={{ ...btnPrimary, opacity: (!customSourceName.trim() || customSourceFields.length === 0) ? 0.5 : 1 }}>
                  {editingCustomSourceId ? 'Save Changes' : 'Add Source'}
                </button>
                <button onClick={() => { setShowAddCustomSource(false); setEditingCustomSourceId(null); setCustomSourceFields([]); setCustomSourceName(''); }} style={btnSecondary}>Cancel</button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600, margin: 0 }}>Notes</h4>
              <button onClick={() => setEditNotes(!editNotes)} style={{ ...btnSecondary, padding: '4px 10px', fontSize: 'var(--cds-font-size-xs)' }}>
                {editNotes ? 'Done' : 'Edit'}
              </button>
            </div>
            {editNotes ? (
              <textarea value={activeProfile.notes} onChange={e => handleNotesChange(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Add context about this customer's environment..." />
            ) : (
              <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {activeProfile.notes || 'No notes yet — click Edit to add context'}
              </p>
            )}
          </div>

          {/* Aggregate Analysis */}
          {analysis && (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>{analysis.totalFields}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Total Fields</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#ef4444' }}>{analysis.totalDroppable}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Droppable</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#a855f7' }}>{analysis.totalGuard}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Guard Protected</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-color-warning)' }}>{analysis.totalSecDetections}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Security Detections</div>
                </div>
                <div style={{ ...card, textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#3b82f6' }}>{analysis.totalObsDetections}</div>
                  <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Obs Detections</div>
                </div>
              </div>

              {/* Reduction potential */}
              <div style={{ ...card, marginBottom: 24, border: '1px solid var(--cds-brand-teal)' }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Aggregate Reduction Potential</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#ef4444' }}>
                      {analysis.totalFields > 0 ? Math.round(analysis.totalDroppable / analysis.totalFields * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Field Drop Rate</div>
                  </div>
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>
                      {analysis.costResult.routingReductionPct}%
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>SIEM Routing Reduction</div>
                  </div>
                  <div style={{ background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--cds-font-size-xxl)', fontWeight: 700, color: '#3b82f6' }}>
                      {analysis.costResult.obsRoutingReductionPct}%
                    </div>
                    <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>Obs Routing Reduction</div>
                  </div>
                </div>
                <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0, lineHeight: 1.6 }}>
                  Across {activeProfile.sourceIds.length} sources: {analysis.totalDroppable} of {analysis.totalFields} total fields can be dropped.
                  Only {analysis.totalSecRequired} fields are required for SIEM detections. Remaining events route to Cribl Lake at storage-tier pricing.
                </p>
              </div>

              {/* Per-source breakdown */}
              <div style={{ ...card, marginBottom: 24 }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 16 }}>Per-Source Breakdown</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cds-font-size-sm)' }}>
                    <thead>
                      <tr style={{ background: 'var(--cds-color-bg-subtle)' }}>
                        {['Source', 'Fields', 'Droppable', 'Drop %', 'Security Det.', 'Obs Det.', 'Guard'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--cds-color-border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.sourceAnalyses.map((sa: any) => (
                        <tr key={sa.id} style={{ borderBottom: '1px solid var(--cds-color-border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{sa.name}</td>
                          <td style={{ padding: '8px 12px' }}>{sa.fields}</td>
                          <td style={{ padding: '8px 12px', color: '#ef4444' }}>{sa.droppable}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--cds-color-bg-muted)', borderRadius: 3 }}>
                                <div style={{ width: `${sa.dropPct}%`, height: '100%', background: '#ef4444', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>{sa.dropPct}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px' }}>{sa.secDetections}</td>
                          <td style={{ padding: '8px 12px' }}>{sa.obsDetections}</td>
                          <td style={{ padding: '8px 12px', color: '#a855f7' }}>{sa.guardCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field Tuning */}
              {activeProfile.sourceIds.length > 0 && (
                <div style={{ ...card, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, margin: 0 }}>Field Tuning</h3>
                      <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: '4px 0 0' }}>
                        Select which fields to keep or drop per source. See detection impact in real-time.
                      </p>
                    </div>
                    <button onClick={() => { setShowFieldTuning(!showFieldTuning); if (!tuningSource) setTuningSource(activeProfile.sourceIds[0]); }}
                      style={showFieldTuning ? btnPrimary : btnSecondary}>
                      {showFieldTuning ? 'Hide Field Tuning' : 'Open Field Tuning'}
                    </button>
                  </div>

                  {showFieldTuning && (
                    <div>
                      {/* Source tabs */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                        {activeProfile.sourceIds.map(sid => {
                          const src = allSources.find(s => s.id === sid);
                          const dropped = droppedFields[sid]?.size || 0;
                          return (
                            <button key={sid} onClick={() => setTuningSource(sid)} style={{
                              padding: '6px 12px', borderRadius: 'var(--cds-radius-md)', cursor: 'pointer',
                              fontSize: 'var(--cds-font-size-xs)', fontWeight: tuningSource === sid ? 600 : 400,
                              border: tuningSource === sid ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)',
                              background: tuningSource === sid ? 'var(--cds-color-bg-subtle)' : 'var(--cds-color-bg)',
                              color: tuningSource === sid ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
                            }}>
                              {src?.name || sid} {dropped > 0 && <span style={{ color: '#ef4444' }}>(-{dropped})</span>}
                            </button>
                          );
                        })}
                      </div>

                      {tuningSource && (() => {
                        const customSrc = activeProfile?.customSources?.find(cs => cs.id === tuningSource);
                        const fields = customSrc ? customSrc.fields : ((fieldMatrix as any)[tuningSource] || []);
                        const dropped = droppedFields[tuningSource] || new Set();
                        const filteredFields = fieldFilter === 'all' ? fields
                          : fieldFilter === 'droppable' ? fields.filter((f: any) => f.canDrop === 'Yes')
                          : fieldFilter === 'security' ? fields.filter((f: any) => f.securitySiem === 'Yes')
                          : fields.filter((f: any) => f.observability === 'Yes' || f.observability === 'Sometimes');

                        return (
                          <div>
                            {/* Impact summary */}
                            {tuningImpact && (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                                <div style={{ padding: 12, background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', textAlign: 'center' }}>
                                  <div style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 700, color: '#ef4444' }}>{tuningImpact.droppedCount}</div>
                                  <div style={{ fontSize: 10, color: 'var(--cds-color-fg-muted)' }}>Dropped</div>
                                </div>
                                <div style={{ padding: 12, background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', textAlign: 'center' }}>
                                  <div style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 700, color: 'var(--cds-brand-teal)' }}>
                                    {tuningImpact.totalFields > 0 ? Math.round(tuningImpact.droppedCount / tuningImpact.totalFields * 100) : 0}%
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--cds-color-fg-muted)' }}>Reduction</div>
                                </div>
                                <div style={{ padding: 12, background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', textAlign: 'center' }}>
                                  <div style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 700, color: tuningImpact.brokenCount > 0 ? 'var(--cds-color-warning)' : 'var(--cds-color-success)' }}>
                                    {tuningImpact.brokenCount}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--cds-color-fg-muted)' }}>Affected</div>
                                </div>
                                <div style={{ padding: 12, background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)', textAlign: 'center' }}>
                                  <div style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 700, color: 'var(--cds-color-success)' }}>{tuningImpact.healthyCount}</div>
                                  <div style={{ fontSize: 10, color: 'var(--cds-color-fg-muted)' }}>Healthy</div>
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              {/* Left: field toggles */}
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    {(['all', 'droppable', 'security', 'observability'] as const).map(mode => (
                                      <button key={mode} onClick={() => setFieldFilter(mode)} style={{
                                        padding: '3px 8px', border: fieldFilter === mode ? '2px solid var(--cds-brand-teal)' : '1px solid var(--cds-color-border)',
                                        borderRadius: 'var(--cds-radius-sm)', cursor: 'pointer', fontSize: 10,
                                        fontWeight: fieldFilter === mode ? 600 : 400, background: 'var(--cds-color-bg)',
                                        color: fieldFilter === mode ? 'var(--cds-brand-teal)' : 'var(--cds-color-fg-muted)',
                                      }}>
                                        {mode === 'all' ? 'All' : mode === 'droppable' ? 'Droppable' : mode === 'security' ? 'Security' : 'Obs'}
                                      </button>
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => dropAllRecommended(tuningSource)} style={{ ...btnSecondary, padding: '3px 8px', fontSize: 10 }}>Drop All Safe</button>
                                    <button onClick={() => keepAll(tuningSource)} style={{ ...btnSecondary, padding: '3px 8px', fontSize: 10 }}>Keep All</button>
                                  </div>
                                </div>
                                <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--cds-color-border-subtle)', borderRadius: 'var(--cds-radius-md)' }}>
                                  {filteredFields.map((f: any) => {
                                    const isDropped = dropped.has(f.field);
                                    return (
                                      <div key={f.field} onClick={() => toggleFieldDrop(tuningSource, f.field)} style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer',
                                        background: isDropped ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                                        borderBottom: '1px solid var(--cds-color-border-subtle)',
                                        opacity: isDropped ? 0.6 : 1,
                                      }}>
                                        <input type="checkbox" checked={!isDropped} readOnly
                                          style={{ width: 12, height: 12, accentColor: 'var(--cds-brand-teal)', pointerEvents: 'none' }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <code style={{ fontSize: 11, fontFamily: 'var(--cds-font-mono)', color: isDropped ? '#ef4444' : 'var(--cds-color-accent)', textDecoration: isDropped ? 'line-through' : 'none' }}>
                                            {f.field}
                                          </code>
                                        </div>
                                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                          {f.securitySiem === 'Yes' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cds-color-warning)' }} title="Security" />}
                                          {(f.observability === 'Yes' || f.observability === 'Sometimes') && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} title="Observability" />}
                                          {f.canDrop === 'Yes' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} title="Safe to drop" />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 10, color: 'var(--cds-color-fg-subtle)' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cds-color-warning)' }} /> Security</span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} /> Obs</span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Droppable</span>
                                </div>
                              </div>

                              {/* Right: detection + search impact */}
                              <div>
                                {(!tuningImpact || tuningImpact.droppedCount === 0) && (
                                  <div style={{ padding: 30, textAlign: 'center', color: 'var(--cds-color-fg-muted)', background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)' }}>
                                    <p style={{ fontSize: 'var(--cds-font-size-sm)', margin: 0 }}>Click fields to drop them and see detection impact</p>
                                  </div>
                                )}
                                {tuningImpact && tuningImpact.droppedCount > 0 && (
                                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                    {/* Broken custom searches */}
                                    {tuningImpact.searchImpact && tuningImpact.searchImpact.filter(s => s.broken).length > 0 && (
                                      <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: '#a855f7', marginBottom: 6 }}>
                                          Custom Searches Broken ({tuningImpact.searchImpact.filter(s => s.broken).length})
                                        </div>
                                        {tuningImpact.searchImpact.filter(s => s.broken).map(s => (
                                          <div key={s.id} style={{ padding: '6px 10px', marginBottom: 4, borderRadius: 'var(--cds-radius-sm)', border: '1px solid #a855f7', background: 'rgba(168,85,247,0.03)' }}>
                                            <span style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 500 }}>{s.name}</span>
                                            <div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)', marginTop: 3 }}>
                                              Missing: {s.missing.map((f: string) => <code key={f} style={{ color: '#a855f7', marginRight: 3 }}>{f}</code>)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Broken detections */}
                                    {[...tuningImpact.secImpact, ...tuningImpact.obsImpact].filter(d => d.broken).length > 0 && (
                                      <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-danger)', marginBottom: 6 }}>
                                          Detections Affected ({[...tuningImpact.secImpact, ...tuningImpact.obsImpact].filter(d => d.broken).length})
                                        </div>
                                        {[...tuningImpact.secImpact, ...tuningImpact.obsImpact].filter(d => d.broken).map(d => (
                                          <div key={d.id} style={{ padding: '6px 10px', marginBottom: 4, borderRadius: 'var(--cds-radius-sm)', border: '1px solid var(--cds-color-danger)', background: 'rgba(239,68,68,0.03)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <span style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 500 }}>{d.name}</span>
                                              <span style={{ fontSize: 10, color: 'var(--cds-color-danger)', fontWeight: 600 }}>{d.coverage}%</span>
                                            </div>
                                            <div style={{ height: 3, background: 'var(--cds-color-bg-muted)', borderRadius: 2, marginTop: 4 }}>
                                              <div style={{ width: `${d.coverage}%`, height: '100%', background: d.coverage > 50 ? 'var(--cds-color-warning)' : 'var(--cds-color-danger)', borderRadius: 2 }} />
                                            </div>
                                            <div style={{ fontSize: 10, color: 'var(--cds-color-fg-subtle)', marginTop: 3 }}>
                                              Missing: {d.missing.map((f: string) => <code key={f} style={{ color: '#ef4444', marginRight: 3 }}>{f}</code>)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {/* Healthy items */}
                                    {([...tuningImpact.secImpact, ...tuningImpact.obsImpact].filter(d => !d.broken).length > 0 || (tuningImpact.searchImpact && tuningImpact.searchImpact.filter(s => !s.broken).length > 0)) && (
                                      <div>
                                        <div style={{ fontSize: 'var(--cds-font-size-xs)', fontWeight: 600, color: 'var(--cds-color-success)', marginBottom: 6 }}>
                                          Healthy ({[...tuningImpact.secImpact, ...tuningImpact.obsImpact].filter(d => !d.broken).length + (tuningImpact.searchImpact ? tuningImpact.searchImpact.filter(s => !s.broken).length : 0)})
                                        </div>
                                        {[...tuningImpact.secImpact, ...tuningImpact.obsImpact].filter(d => !d.broken).map(d => (
                                          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 2, borderRadius: 'var(--cds-radius-sm)', background: 'var(--cds-color-bg-subtle)' }}>
                                            <span style={{ color: 'var(--cds-color-success)', fontSize: 10 }}>&#10003;</span>
                                            <span style={{ fontSize: 11, color: 'var(--cds-color-fg-muted)' }}>{d.name}</span>
                                          </div>
                                        ))}
                                        {tuningImpact.searchImpact && tuningImpact.searchImpact.filter(s => !s.broken).map(s => (
                                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', marginBottom: 2, borderRadius: 'var(--cds-radius-sm)', background: 'var(--cds-color-bg-subtle)' }}>
                                            <span style={{ color: '#a855f7', fontSize: 10 }}>&#10003;</span>
                                            <span style={{ fontSize: 11, color: 'var(--cds-color-fg-muted)' }}>{s.name} <span style={{ fontSize: 9, color: '#a855f7' }}>(search)</span></span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Searches */}
              {activeProfile.sourceIds.length > 0 && (
                <div style={{ ...card, marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, margin: 0 }}>Custom Searches</h3>
                      <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: '4px 0 0' }}>
                        Add your own KQL searches. Referenced fields are validated and factored into droppable field analysis.
                      </p>
                    </div>
                    <button onClick={() => { setShowAddSearch(!showAddSearch); if (!searchSourceId) setSearchSourceId(activeProfile.sourceIds[0]); }}
                      style={showAddSearch ? btnPrimary : btnSecondary}>
                      {showAddSearch ? 'Cancel' : '+ Add Search'}
                    </button>
                  </div>

                  {showAddSearch && (
                    <div style={{ background: 'var(--cds-color-bg-subtle)', padding: 16, borderRadius: 'var(--cds-radius-md)', marginBottom: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Search Name *</label>
                          <input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="e.g. Failed Login Spike" style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Category *</label>
                          <select value={searchCategory} onChange={e => setSearchCategory(e.target.value as any)} style={{ ...inputStyle, padding: '8px 10px' }}>
                            <option value="security">Security</option>
                            <option value="observability">Observability</option>
                            <option value="both">Both</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Source *</label>
                          <select value={searchSourceId} onChange={e => setSearchSourceId(e.target.value)} style={{ ...inputStyle, padding: '8px 10px' }}>
                            <option value="">Select source...</option>
                            {activeProfile.sourceIds.map(sid => {
                              const src = allSources.find(s => s.id === sid);
                              return <option key={sid} value={sid}>{src?.name || sid}</option>;
                            })}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                          <input value={searchDesc} onChange={e => setSearchDesc(e.target.value)} placeholder="What this search detects" style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', display: 'block', marginBottom: 4 }}>KQL Query *</label>
                        <textarea value={searchQuery} onChange={e => handleValidateSearch(e.target.value)}
                          placeholder={'dataset="$DATASET" earliest=-24h\n| where field="value"\n| summarize count() by src_ip\n| order by count_ desc'}
                          style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'var(--cds-font-mono)', fontSize: 12 }} />
                      </div>

                      {searchValidation && (
                        <div style={{ marginBottom: 12, padding: 12, borderRadius: 'var(--cds-radius-md)', background: 'var(--cds-color-bg)', border: `1px solid ${searchValidation.valid ? 'var(--cds-color-success)' : 'var(--cds-color-danger)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: searchValidation.valid ? 'var(--cds-color-success)' : 'var(--cds-color-danger)', fontWeight: 600 }}>
                              {searchValidation.valid ? '✓ Valid KQL' : '✗ Invalid KQL'}
                            </span>
                          </div>
                          {searchValidation.errors.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              {searchValidation.errors.map((err, i) => (
                                <div key={i} style={{ fontSize: 11, color: 'var(--cds-color-danger)', marginBottom: 2 }}>Error: {err}</div>
                              ))}
                            </div>
                          )}
                          {searchValidation.warnings.length > 0 && (
                            <div style={{ marginBottom: 6 }}>
                              {searchValidation.warnings.map((w, i) => (
                                <div key={i} style={{ fontSize: 11, color: 'var(--cds-color-warning)', marginBottom: 2 }}>Warning: {w}</div>
                              ))}
                            </div>
                          )}
                          {searchValidation.referencedFields.length > 0 && (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--cds-color-fg-muted)', marginBottom: 4 }}>Referenced Fields ({searchValidation.referencedFields.length}):</div>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {searchValidation.referencedFields.map(f => (
                                  <code key={f} style={{ fontSize: 10, padding: '1px 6px', background: 'var(--cds-color-accent-subtle)', borderRadius: 3, color: 'var(--cds-color-accent)' }}>{f}</code>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button onClick={handleAddSearch}
                        disabled={!searchName.trim() || !searchQuery.trim() || !searchSourceId || !searchValidation?.valid}
                        style={{ ...btnPrimary, opacity: (!searchName.trim() || !searchQuery.trim() || !searchSourceId || !searchValidation?.valid) ? 0.5 : 1 }}>
                        Add Search
                      </button>
                    </div>
                  )}

                  {/* List existing custom searches */}
                  {(activeProfile.customSearches || []).length > 0 && (
                    <div>
                      {(activeProfile.customSearches || []).map(search => {
                        const src = allSources.find(s => s.id === search.sourceId);
                        const dropped = droppedFields[search.sourceId] || new Set();
                        const liveRefs = [...new Set([...search.referencedFields, ...parseKqlFields(search.query)])];
                        const brokenFields = liveRefs.filter(f => dropped.has(f));
                        const isBroken = brokenFields.length > 0;
                        return (
                          <div key={search.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', marginBottom: 6, borderRadius: 'var(--cds-radius-md)', border: `1px solid ${isBroken ? 'var(--cds-color-danger)' : 'var(--cds-color-border-subtle)'}`, background: isBroken ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 'var(--cds-font-size-sm)', fontWeight: 600 }}>{search.name}</span>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: (search.category || 'security') === 'security' ? 'rgba(234,179,8,0.1)' : (search.category === 'observability' ? 'rgba(59,130,246,0.1)' : 'rgba(168,85,247,0.1)'), color: (search.category || 'security') === 'security' ? 'var(--cds-color-warning)' : (search.category === 'observability' ? '#3b82f6' : '#a855f7'), fontWeight: 600 }}>
                                  {(search.category || 'security') === 'both' ? 'Sec + Obs' : (search.category || 'security') === 'security' ? 'Security' : 'Observability'}
                                </span>
                                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--cds-color-bg-subtle)', color: 'var(--cds-color-fg-muted)' }}>{src?.name || search.sourceId}</span>
                                {isBroken && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(239,68,68,0.1)', color: 'var(--cds-color-danger)', fontWeight: 600 }}>BROKEN</span>}
                              </div>
                              {search.description && <div style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)', marginBottom: 4 }}>{search.description}</div>}
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {liveRefs.map(f => (
                                  <code key={f} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: brokenFields.includes(f) ? 'rgba(239,68,68,0.1)' : 'var(--cds-color-accent-subtle)', color: brokenFields.includes(f) ? 'var(--cds-color-danger)' : 'var(--cds-color-accent)', textDecoration: brokenFields.includes(f) ? 'line-through' : 'none' }}>{f}</code>
                                ))}
                              </div>
                            </div>
                            <span onClick={() => removeCustomSearch(search.id)} style={{ cursor: 'pointer', color: 'var(--cds-color-danger)', fontSize: 12, marginTop: 2 }} title="Remove search">&#x2715;</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Cross-source correlation fields */}
              {correlationCoverage.length > 0 && (
                <div style={{ ...card, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 8 }}>Cross-Source Correlation Fields</h3>
                  <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', marginBottom: 16 }}>
                    Fields shared across multiple sources — these enable cross-source correlation and pivot-based investigation.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                    {correlationCoverage.map(cf => (
                      <div key={cf.field} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--cds-color-bg-subtle)', borderRadius: 'var(--cds-radius-md)' }}>
                        <code style={{ fontSize: 'var(--cds-font-size-xs)', fontFamily: 'var(--cds-font-mono)', color: 'var(--cds-color-accent)', fontWeight: 600 }}>{cf.field}</code>
                        <span style={{ fontSize: 'var(--cds-font-size-xs)', color: 'var(--cds-color-fg-muted)' }}>in {cf.sources.length} sources</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coverage gaps */}
              {analysis.coverageGaps.length > 0 && (
                <div style={{ ...card, marginBottom: 24, borderColor: 'var(--cds-color-warning)' }}>
                  <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 12, color: 'var(--cds-color-warning)' }}>Coverage Gaps</h3>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', lineHeight: 2 }}>
                    {analysis.coverageGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                  </ul>
                </div>
              )}

              {/* Destinations */}
              <div style={{ ...card, marginBottom: 24 }}>
                <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 12 }}>Relevant Destinations</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {analysis.destinations.map(d => <span key={d} style={tag('var(--cds-color-success-subtle)', 'var(--cds-color-success)')}>{d}</span>)}
                </div>
              </div>

              {/* Export combined pack */}
              <div style={{ ...card, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--cds-font-size-lg)', fontWeight: 600, marginBottom: 4 }}>Export Combined Pack</h3>
                    <p style={{ fontSize: 'var(--cds-font-size-sm)', color: 'var(--cds-color-fg-muted)', margin: 0 }}>
                      Single pipeline YAML with optimization functions for all {activeProfile.sourceIds.length} selected sources
                    </p>
                  </div>
                  <button onClick={downloadCombinedPack} style={btnPrimary}>Download Combined YAML</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
