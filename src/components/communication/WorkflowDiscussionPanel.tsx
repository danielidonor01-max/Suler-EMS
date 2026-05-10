'use client';

import React, { useState, useEffect } from 'react';
import { History, Lock, Info, ExternalLink } from 'lucide-react';
import ChatPanel from './ChatPanel';

interface WorkflowDiscussionPanelProps {
  workflowId: string;
  resourceId: string;
  resourceType: string;
  title: string;
}

const WorkflowDiscussionPanel: React.FC<WorkflowDiscussionPanelProps> = ({
  workflowId,
  resourceId,
  resourceType,
  title
}) => {
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { ensureConversation(); }, [workflowId, resourceId]);

  const ensureConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/communication/conversations', {
        method: 'POST',
        body: JSON.stringify({
          type: 'WORKFLOW',
          targetId: resourceId,
          resourceType,
          name: `Discussion: ${title}`
        })
      });
      const data = await res.json();
      if (data.success) setConversation(data.data);
    } catch (err) {
      console.error('Failed to ensure workflow conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      {/* Context Banner */}
      <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">Workflow Audit Discussion</h4>
            <p className="text-[10px] text-indigo-600 uppercase tracking-widest font-bold">Contextual Organizational Memory</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <Lock className="w-3 h-3" />
          Audit-Preserved
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
          <p className="text-xs text-slate-400 animate-pulse">Initializing discussion context...</p>
        </div>
      ) : conversation ? (
        <ChatPanel
          conversationId={conversation.id}
          conversationName={conversation.name}
          classification="WORKFLOW"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Info className="w-12 h-12 text-slate-300 mb-4" />
          <h4 className="text-slate-600 font-bold mb-2">Discussion unavailable</h4>
          <p className="text-xs text-slate-400 max-w-[200px]">
            Unable to initialize the collaboration layer for this workflow instance.
          </p>
        </div>
      )}

      {/* Audit Linkage Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Discussion linked to Audit ID: {workflowId.split('-')[0]}
        </div>
        <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 transition-colors">
          View Audit Trail
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default WorkflowDiscussionPanel;
