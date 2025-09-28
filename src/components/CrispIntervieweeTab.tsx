import React from 'react';
import CrispIntervieweeChat from './CrispIntervieweeChat';

interface CrispIntervieweeTabProps {
  onCandidateAdd?: (candidate: any) => void;
  onCandidateUpdate?: (candidateId: string, updates: any) => void;
}

const CrispIntervieweeTab: React.FC<CrispIntervieweeTabProps> = ({
  onCandidateAdd,
  onCandidateUpdate
}) => {
  return (
    <div className="w-full">
      <CrispIntervieweeChat 
        onCandidateAdd={onCandidateAdd}
        onCandidateUpdate={onCandidateUpdate}
      />
    </div>
  );
};

export default CrispIntervieweeTab;