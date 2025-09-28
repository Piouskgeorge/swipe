import { useSelector, useDispatch } from 'react-redux';
import { Play, Square, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RootState } from '../store';
import { hideWelcomeBack } from '../store/slices/appSlice';
import { resumeInterview, clearInterview } from '../store/slices/interviewSlice';
import { updateCandidate } from '../store/slices/candidatesSlice';

interface WelcomeBackModalProps {
  visible: boolean;
  onClose: () => void;
}

const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const { resumedCandidateId } = useSelector((state: RootState) => state.app);
  const { candidates } = useSelector((state: RootState) => state.candidates);
  
  const resumedCandidate = candidates.find((c: any) => c.id === resumedCandidateId);

  const handleResume = () => {
    if (resumedCandidate) {
      dispatch(resumeInterview());
      dispatch(updateCandidate({
        id: resumedCandidate.id,
        updates: { status: 'interviewing' }
      }));
    }
    dispatch(hideWelcomeBack());
    onClose();
  };

  const handleStartNew = () => {
    if (resumedCandidate) {
      dispatch(clearInterview());
      dispatch(updateCandidate({
        id: resumedCandidate.id,
        updates: { status: 'pending' }
      }));
    }
    dispatch(hideWelcomeBack());
    onClose();
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-blue-600 mb-2">
            Welcome Back! 👋
          </DialogTitle>
          <DialogDescription className="text-base">
            We detected an incomplete interview session
          </DialogDescription>
        </DialogHeader>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900">Incomplete Interview Detected</h4>
                <p className="text-sm text-blue-800">
                  {resumedCandidate
                    ? `You have an incomplete interview session for ${resumedCandidate.name}. Would you like to continue where you left off or start a new interview?`
                    : "You have an incomplete interview session. Would you like to continue or start fresh?"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleResume}
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Resume Interview
          </Button>
          
          <Button
            onClick={handleStartNew}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <Square className="h-4 w-4 mr-2" />
            Start New Interview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;