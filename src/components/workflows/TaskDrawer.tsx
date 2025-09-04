import { TaskDetail } from './TaskDetail';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface TaskDrawerProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDrawer = ({ taskId, isOpen, onClose }: TaskDrawerProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-2xl sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes da Tarefa</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {taskId && (
            <TaskDetail 
              taskId={taskId} 
              isDrawer={true} 
              onClose={onClose}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};