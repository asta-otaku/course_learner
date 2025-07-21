import React, { useState } from "react";

import BackArrow from "@/assets/svgs/arrowback";
import EditPencilIcon from "@/assets/svgs/editPencil";
import WalletIcon, { WalletPaymentIcon } from "@/assets/svgs/wallet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

function StepTwo({ setStep }: { setStep: (step: number) => void }) {
  const [cards, setCards] = useState([
    {
      id: 1,
      last4: "7290",
      expiry: "02/03",
      brandIcon: "/visa.png",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  const handleAddCard = () => {
    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    const formattedExpiry = expiryDate
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d{0,2})/, "$1/$2")
      .slice(0, 5);

    const newCard = {
      id: Date.now(),
      last4,
      expiry: formattedExpiry,
      brandIcon: "/visa.png",
    };

    setCards((prev) => [...prev, newCard]);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteCard = (id: number) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const resetForm = () => {
    setCardNumber("");
    setCardholderName("");
    setExpiryDate("");
    setCvv("");
  };

  // Format card number as user types
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    if (!match) return "";

    return (
      match[1] +
      (match[2] ? " " + match[2] : "") +
      (match[3] ? " " + match[3] : "") +
      (match[4] ? " " + match[4] : "")
    );
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };
  return (
    <div className="w-full flex flex-col items-center px-4">
      <div className="w-full flex justify-between items-center gap-4">
        <div className="flex items-start gap-12 w-full mb-6">
          <div
            className="self-start text-sm cursor-pointer"
            onClick={() => setStep(0)}
          >
            <BackArrow color="#808080" />
          </div>
          <div>
            <h1 className="text-textGray font-semibold md:text-lg">
              Manage Payment Method
            </h1>
            <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
              Add or remove your payment methods
            </p>
          </div>
        </div>

        {/* Add Card Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#34C759] text-white rounded-lg flex items-center gap-2 text-sm font-medium">
              Add Card
              <WalletIcon />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Add New Card</DialogTitle>
              <DialogDescription>
                Enter your card details. We'll never store your full card
                information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardNumber" className="text-right">
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cardholderName" className="text-right">
                  Name on Card
                </Label>
                <Input
                  id="cardholderName"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="John Doe"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) =>
                    setExpiryDate(formatExpiryDate(e.target.value))
                  }
                  placeholder="MM/YY"
                  maxLength={5}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cvv" className="text-right">
                  CVV
                </Label>
                <Input
                  id="cvv"
                  type="password"
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  placeholder="123"
                  maxLength={3}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddCard}
                disabled={!cardNumber || !expiryDate || !cvv}
              >
                Add Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
          <WalletPaymentIcon />
          <h2 className="text-[#626262] font-semibold text-xl md:text-xl">
            You have no cards yet
          </h2>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-3 text-sm font-medium px-2 mb-2 text-[#626262]">
            <span>Card Number</span>
            <span className="text-center">Expires</span>
            <span></span>
          </div>
          {cards.map((card) => (
            <div
              key={card.id}
              className="grid grid-cols-3 border border-black/10 rounded-xl px-4 py-3 mb-2"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-8 bg-gray-200 rounded-md" />
                <span className="tracking-widest font-medium text-black">
                  •••• •••• •••• {card.last4}
                </span>
              </div>
              <span className="text-[#626262] font-medium text-center align-bottom py-3">
                {card.expiry}
              </span>
              <div className="flex items-center gap-2 justify-end">
                <button
                  className="text-sm w-10 h-10 flex items-center justify-center"
                  title="Edit"
                >
                  <EditPencilIcon />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="text-sm bg-red-50 text-red-500 border border-red-100 rounded-full w-6 h-6 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="text-center px-6 py-8 max-w-md">
                    <AlertDialogHeader>
                      <div className="flex flex-col items-center space-y-4">
                        <Trash2 className="text-red-500 w-6 h-6" />
                        <AlertDialogTitle className="text-base font-semibold uppercase text-textGray">
                          Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 text-center">
                          This action cannot be undone. Are you sure you want to
                          delete this payment method?
                        </AlertDialogDescription>
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="grid grid-cols-1 gap-1.5 mt-3">
                      <AlertDialogAction
                        className="bg-[#FF0000] hover:bg-[#e60000] text-white rounded-full w-full py-2 text-sm font-medium"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        Delete Payment Method
                      </AlertDialogAction>
                      <AlertDialogCancel className="text-xs text-gray-500 hover:text-black border-none shadow-none font-medium">
                        Cancel
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StepTwo;
