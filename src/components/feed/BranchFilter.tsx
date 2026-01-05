import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BranchFilterProps {
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  onFindPeople?: () => void;
}

const branches = ['All', 'CSE', 'ECE', 'EEE', 'Civil', 'Mechanical'];

const BranchFilter = ({ selectedBranch, onSelectBranch, onFindPeople }: BranchFilterProps) => {
  const otherBranches = branches.filter(b => b !== 'All');

  return (
    <div className="bg-card rounded-2xl shadow-soft p-2">
      {/* Desktop View: Horizontal Scroll */}
      <div className="hidden md:flex gap-2 overflow-x-auto scrollbar-hide min-w-max">
        {branches.map((branch) => (
          <button
            key={branch}
            onClick={() => onSelectBranch(branch)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap",
              selectedBranch === branch
                ? "gradient-bg text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {branch === 'All' ? '🏠 Home' : branch}
          </button>
        ))}

        {onFindPeople && (
          <button
            onClick={onFindPeople}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Users className="w-4 h-4" />
            Find People
          </button>
        )}
      </div>

      {/* Mobile View: Home Button + Dropdown + Find People */}
      <div className="flex md:hidden gap-2 w-full">
        {/* Home Button */}
        <button
          onClick={() => onSelectBranch('All')}
          className={cn(
            "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2",
            selectedBranch === 'All'
              ? "gradient-bg text-primary-foreground shadow-soft"
              : "bg-muted text-muted-foreground"
          )}
        >
          🏠
          <span className="sr-only">Home</span>
        </button>

        {/* Branch Dropdown */}
        <div className="flex-1">
          <Select
            value={selectedBranch === 'All' ? '' : selectedBranch}
            onValueChange={onSelectBranch}
          >
            <SelectTrigger className="w-full h-[38px] rounded-xl bg-muted border-none text-muted-foreground focus:ring-0">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {otherBranches.map((branch) => (
                <SelectItem key={branch} value={branch}>
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Find People Button */}
        {onFindPeople && (
          <button
            onClick={onFindPeople}
            className="px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 items-center justify-center flex"
          >
            <Users className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BranchFilter;
