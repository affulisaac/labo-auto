import { Handle, NodeProps, Position } from 'reactflow';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { BeakerIcon, CheckIcon, ChevronDownIcon, TrashIcon, XIcon, ThermometerIcon, ScanBarcodeIcon, DropletIcon, ShieldIcon, Settings2Icon } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '../ui/dropdown-menu';
import { labwareOptions } from '@/lib/types/labware';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface LabwareConfig {
  type: string;
  slot: number;
  barcode?: string;
  maxVolume?: number;
  initialVolume?: number;
  temperature?: number;
  isSealed?: boolean;
  reagentMapping?: Record<string, string>;
  compatibleInstruments?: string[];
  isReadOnly?: boolean;
  taskAssignment?: string[];
  capacityUsed?: number;
}

interface TaskNodeProps extends NodeProps {
  data: {
    instrument: any;
    selectedTasks: string[];
    selectedLabware: Record<string, string[]>;
    labwareConfig?: Record<string, Record<string, LabwareConfig>>;
    onTaskSelect: (taskName: string) => void;
    onTaskRemove: (taskName: string) => void;
    onLabwareSelect: (taskName: string, labwareId: string) => void;
    onLabwareRemove: (taskName: string, labwareId: string) => void;
    onLabwareConfigUpdate: (taskName: string, labwareId: string, config: LabwareConfig) => void;
    onDelete: () => void;
  };
}

export default function TaskNode({ data, isConnectable, selected }: TaskNodeProps) {
  const { 
    instrument, 
    selectedTasks = [], 
    selectedLabware = {},
    labwareConfig = {},
    onTaskSelect, 
    onTaskRemove, 
    onLabwareSelect,
    onLabwareRemove,
    onLabwareConfigUpdate,
    onDelete 
  } = data;

  const getLabwareConfig = (taskName: string, labwareId: string): LabwareConfig => {
    return (labwareConfig[taskName]?.[labwareId]) || {
      type: labwareOptions.find(l => l.id === labwareId)?.type || '',
      slot: 1,
      maxVolume: 0,
      initialVolume: 0,
      temperature: 25,
      isSealed: false,
      reagentMapping: {},
      compatibleInstruments: [],
      isReadOnly: false,
      taskAssignment: [],
      capacityUsed: 0
    };
  };

  const handleLabwareRemove = (taskName: string, labwareId: string) => {
    onLabwareRemove(taskName, labwareId);
  };

  const handleConfigUpdate = (taskName: string, labwareId: string, updates: Partial<LabwareConfig>) => {
    const currentConfig = getLabwareConfig(taskName, labwareId);
    onLabwareConfigUpdate(taskName, labwareId, {
      ...currentConfig,
      ...updates
    });
  };
  
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border-2 shadow-lg backdrop-blur-sm min-w-[280px] transition-all duration-200 group relative',
        'bg-gradient-to-br from-primary-50 to-primary-100/50 border-primary-200 hover:border-primary-300',
        'dark:from-primary-950 dark:to-primary-900/50 dark:border-primary-800 dark:hover:border-primary-700',
        selected && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background'
      )}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-6 h-6 flex items-center justify-center">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className={cn(
            "w-4 h-4 rounded-full border-2 border-primary",
            "bg-background dark:bg-background",
            "transition-all duration-200",
            "hover:scale-125 hover:border-primary/80",
            "before:content-[''] before:absolute before:inset-0 before:rounded-full",
            "before:animate-ping before:bg-primary/20",
            "after:content-[''] after:absolute after:inset-[2px] after:rounded-full",
            "after:bg-primary/20 after:transition-all after:duration-200",
            "group-hover:after:bg-primary/40"
          )}
        />
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <Badge 
          variant="secondary" 
          className="flex items-center gap-1 font-medium"
        >
          <BeakerIcon className="h-4 w-4" />
          {instrument.driver.name}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant="outline">v{instrument.driver.version}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive"
            onClick={onDelete}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="font-medium text-sm mb-3">{data.label}</div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Selected Tasks</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Add Task
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {instrument.driver.tasks?.map(task => (
                  <DropdownMenuItem
                    key={task.name}
                    onClick={() => onTaskSelect(task.name)}
                    disabled={selectedTasks.includes(task.name)}
                  >
                    <div className="flex items-center gap-2">
                      {selectedTasks.includes(task.name) && (
                        <CheckIcon className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-xs text-muted-foreground">{task.description}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {selectedTasks.length > 0 && (
            <div className="space-y-2">
              {selectedTasks.map(taskName => {
                const task = instrument.driver.tasks?.find(t => t.name === taskName);
                const taskLabware = selectedLabware[taskName] || [];
                
                return (
                  <div key={taskName} className="p-2 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{taskName}</div>
                        {task?.parameters && task.parameters.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {task.parameters.map(param => (
                              <Badge key={param} variant="secondary" className="text-xs">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={() => onTaskRemove?.(taskName)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">Labware</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              Add Labware
                              <ChevronDownIcon className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Available Labware</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {labwareOptions.map(labware => (
                              <DropdownMenuItem
                                key={labware.id}
                                onClick={() => onLabwareSelect?.(taskName, labware.id)}
                                disabled={taskLabware.includes(labware.id)}
                              >
                                <div>
                                  <div className="font-medium">{labware.name}</div>
                                  <div className="text-xs text-muted-foreground">{labware.description}</div>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {taskLabware.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {taskLabware.map(labwareId => {
                            const labware = labwareOptions.find(l => l.id === labwareId);
                            const config = getLabwareConfig(taskName, labwareId);
                            
                            return (
                              <div key={labwareId} className="bg-background rounded p-2">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs font-medium">{labware?.name}</div>
                                  <div className="flex items-center gap-1">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          <Settings2Icon className="h-3 w-3" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Configure {labware?.name}</DialogTitle>
                                        </DialogHeader>
                                        <ScrollArea className="h-[300px]">
                                          <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-2">
                                                <Label>Slot Number</Label>
                                                <Input
                                                  type="number"
                                                  value={config.slot}
                                                  onChange={(e) => handleConfigUpdate(taskName, labwareId, {
                                                    slot: parseInt(e.target.value)
                                                  })}
                                                  min={1}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Temperature (°C)</Label>
                                                <Input
                                                  type="number"
                                                  value={config.temperature}
                                                  onChange={(e) => handleConfigUpdate(taskName, labwareId, {
                                                    temperature: parseInt(e.target.value)
                                                  })}
                                                />
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <Label>Sealed</Label>
                                              <Switch
                                                checked={config.isSealed}
                                                onCheckedChange={(checked) => handleConfigUpdate(taskName, labwareId, {
                                                  isSealed: checked
                                                })}
                                              />
                                            </div>
                                          </div>
                                        </ScrollArea>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:text-destructive"
                                      onClick={() => handleLabwareRemove(taskName, labwareId)}
                                    >
                                      <XIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {config && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs justify-start">
                                      <ThermometerIcon className="h-3 w-3 mr-1" />
                                      {config.temperature}°C
                                    </Badge>
                                    {config.isSealed && (
                                      <Badge variant="outline" className="text-xs justify-start">
                                        <ShieldIcon className="h-3 w-3 mr-1" />
                                        Sealed
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-6 h-6 flex items-center justify-center">
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className={cn(
            "w-4 h-4 rounded-full border-2 border-primary",
            "bg-background dark:bg-background",
            "transition-all duration-200",
            "hover:scale-125 hover:border-primary/80",
            "before:content-[''] before:absolute before:inset-0 before:rounded-full",
            "before:animate-ping before:bg-primary/20",
            "after:content-[''] after:absolute after:inset-[2px] after:rounded-full",
            "after:bg-primary/20 after:transition-all after:duration-200",
            "group-hover:after:bg-primary/40"
          )}
        />
      </div>
    </div>
  );
}