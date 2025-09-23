import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        y: e.clientY - offsetY,
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

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation?: string) => {
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
    setOperation(nextOperation || null);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const buttonClass = "h-12 text-lg font-semibold";

  return (
    <div
      className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 'auto' : '320px',
      }}
    >
      <Card className="shadow-lg border-2 bg-background/95 backdrop-blur">
        <CardHeader 
          className="cursor-move pb-2 flex flex-row items-center justify-between"
          onMouseDown={handleMouseDown}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            🧮 Calculator
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? '◰' : '◱'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="space-y-3">
            <Input
              value={display}
              readOnly
              className="text-right text-2xl font-mono h-12 bg-muted"
            />
            
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                className={buttonClass}
                onClick={clear}
              >
                C
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => setDisplay(display.slice(0, -1) || '0')}
              >
                ⌫
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => performOperation('/')}
              >
                ÷
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => performOperation('*')}
              >
                ×
              </Button>

              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('7')}
              >
                7
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('8')}
              >
                8
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('9')}
              >
                9
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => performOperation('-')}
              >
                −
              </Button>

              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('4')}
              >
                4
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('5')}
              >
                5
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('6')}
              >
                6
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => performOperation('+')}
              >
                +
              </Button>

              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('1')}
              >
                1
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('2')}
              >
                2
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={() => inputDigit('3')}
              >
                3
              </Button>
              <Button
                variant="default"
                className={`${buttonClass} row-span-2`}
                onClick={() => performOperation('=')}
              >
                =
              </Button>

              <Button
                variant="outline"
                className={`${buttonClass} col-span-2`}
                onClick={() => inputDigit('0')}
              >
                0
              </Button>
              <Button
                variant="outline"
                className={buttonClass}
                onClick={inputDecimal}
              >
                .
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};