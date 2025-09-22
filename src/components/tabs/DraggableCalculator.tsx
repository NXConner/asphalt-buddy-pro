import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Calculator, Minimize2, Maximize2 } from "lucide-react";

interface DraggableCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DraggableCalculator = ({ isOpen, onClose }: DraggableCalculatorProps) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const buttons = [
    ['CE', 'C', '⌫', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['±', '0', '.', '=']
  ];

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 bg-primary text-primary-foreground rounded-lg p-2 cursor-move shadow-lg"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          <span className="text-sm font-medium">Calculator</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 bg-background border rounded-lg shadow-2xl"
      style={{ left: position.x, top: position.y, width: '280px' }}
    >
      <Card className="border-0 shadow-none">
        <CardHeader 
          className="pb-2 cursor-move bg-muted/50 rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4" />
              Calculator
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-4">
            <Input
              value={display}
              readOnly
              className="text-right text-xl font-mono bg-muted"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((btn) => (
              <Button
                key={btn}
                variant={['÷', '×', '-', '+', '='].includes(btn) ? "default" : "outline"}
                className="h-12 text-sm font-medium"
                onClick={() => {
                  if (btn === 'C') clear();
                  else if (btn === 'CE') clearEntry();
                  else if (btn === '⌫') setDisplay(display.slice(0, -1) || '0');
                  else if (btn === '±') setDisplay(String(-parseFloat(display)));
                  else if (btn === '=') performCalculation();
                  else if (['÷', '×', '-', '+'].includes(btn)) inputOperation(btn);
                  else if (btn === '.') {
                    if (display.indexOf('.') === -1) {
                      inputNumber(display === '0' ? '0.' : display + '.');
                    }
                  }
                  else inputNumber(btn);
                }}
              >
                {btn}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};