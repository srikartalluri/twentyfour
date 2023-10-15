import {useEffect, useState } from "react";
import validInputs from "./validkeys.json";
import CardDisplay from "./component/CardDisplay";
import Expression from "./component/Expression";
import { DoublyLinkedList } from "doubly-linked-list-typed";
import evaluate from "ts-expression-evaluator";

function App() {
  const [curExpression, setCurExpression] = useState(() => {
    const list = new DoublyLinkedList<String>();
    list.addLast("Enter");

    return list;
  });

  const [realNums, setRealNums] = useState(() => {
    let a = Math.ceil(Math.random() * 13);
    let b = Math.ceil(Math.random() * 13);
    let c = Math.ceil(Math.random() * 13);
    let d = Math.ceil(Math.random() * 13);

    return [a, b, c, d];
  });

  const [nums, setNums] = useState(() => {
    let a = realNums[0];
    let b = realNums[1];
    let c = realNums[2];
    let d = realNums[3];

    return [a, b, c, d];
  });

  const resetNums = () => {
    let a = Math.ceil(Math.random() * 13);
    let b = Math.ceil(Math.random() * 13);
    let c = Math.ceil(Math.random() * 13);
    let d = Math.ceil(Math.random() * 13);

    setRealNums([a, b, c, d]);
  };

  const reloadNums = () => {
    setNums([...realNums]);
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const typedValue = event.key;
    const regex = /^\d+$/;
    if (event.key === "Backspace") {
      setCurExpression((prev) => {
        const ret = DoublyLinkedList.fromArray(prev.toArray());

        if (ret.peekLast() !== "Enter") {
          ret.pop();
        }

        if (ret.length === 0) {
          ret.addLast("Enter");
        }
        return ret;
      });
    } else if (regex.test(typedValue)) {
      setCurExpression((prev) => {
        const ret = DoublyLinkedList.fromArray(prev.toArray());
        const last = ret.pop();
        if (last !== undefined && regex.test(last.toString())) {
          ret.addLast(last + typedValue);
        } else if (last !== undefined) {
          ret.addLast(last);
          ret.addLast(typedValue);
        }

        if (ret.peekFirst() === "Enter") {
          ret.pollFirst();
        }

        // ret.addLast(typedValue);
        return ret;
      });
    } else if (
      typedValue in validInputs ||
      typedValue === "x" ||
      typedValue === "/" ||
      typedValue === "-" ||
      typedValue === "+" ||
      typedValue === "(" ||
      typedValue === ")"
    ) {
      setCurExpression((prev) => {
        const ret = DoublyLinkedList.fromArray(prev.toArray());
        ret.addLast(typedValue);
        if (ret.peekFirst() === "Enter") {
          ret.pollFirst();
        }
        return ret;
      });
    } else if (event.key === "Enter") {
      const expCpy = DoublyLinkedList.fromArray(curExpression.toArray());
      console.log("expCpy", expCpy);

      setNums((prevNums) => {
        const tmp = [...prevNums];
        console.log("tmp", tmp);
        console.log(curExpression);
        if (curExpression.peekLast() === "Enter") {
          return prevNums;
        }

        for (let i = 0; i < curExpression.length; i++) {
          let curNodeVal = curExpression.getNodeAt(i)?.val;
          if (curNodeVal === undefined) {
            continue;
          }
          let curNum = parseInt(curNodeVal.toString());
          if (Number.isNaN(curNum)) {
            continue;
          }
          console.log("curNum", curNum);

          const condition = (numm: number) => numm === curNum;

          let nextI = tmp.findIndex(condition);
          if (nextI !== -1) {
            tmp[nextI] = -999;
          } else {
            console.log("bad");
            return prevNums;
          }
        }

        console.log("good");

        let total = "";

        for (let i = 0; i < curExpression.length; i++) {
          let cur = curExpression.getNodeAt(i)?.val;
          if (cur === "x") {
            total += "*";
          } else {
            total += cur;
          }
        }

        console.log(total);

        let ret: number;

        try {
          console.log(evaluate(total));
          console.log(typeof evaluate(total));
          ret = evaluate(total);
        } catch (error: any) {
          console.error(`Caught an error: ${error.message}`);
          return nums;
        }

        const newNums = tmp.filter((num) => num !== -999);
        if (ret !== undefined) {
          newNums.push(ret);
        }
        console.log(newNums);
        return newNums;
      });

      setCurExpression((prev) => {
        const ret = DoublyLinkedList.fromArray(prev.toArray());
        ret.clear();
        ret.addLast("Enter");
        return ret;
      });
    } else {
      console.log(event.key);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [curExpression, nums]);

  useEffect(() => {
    console.log("Updated expression:", curExpression.toArray());
  }, [curExpression]);

  useEffect(() => {
    let a = realNums[0];
    let b = realNums[1];
    let c = realNums[2];
    let d = realNums[3];

    setNums([a, b, c, d]);
  }, [realNums]);

  useEffect(() => {
    console.log("Updated Nums:");
    console.log(nums);

    const timer = setTimeout(() => {
      if (nums.length === 1 && nums[0] === 24) {
        resetNums();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [nums]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#76cfe3] to-[#1b2ebf] pb-20">
      <div className="font-adlam max-w-3xl flex items-center flex-col gap-8 mx-auto pt-12">
        <CardDisplay nums={nums} />
        <Expression expressionList={curExpression} />

        <div className="grid-container grid grid-cols-2 grid-rows-2 gap-x-5">
          <div className="rounded-lg text-center overflow-hidden shadow-lg bg-[#9F9F9F] p-5">
            <button onClick={reloadNums}>Reload Current Numbers</button>
          </div>

          <div className="rounded-lg text-center overflow-hidden shadow-lg bg-[#9F9F9F] p-5">
            <button onClick={resetNums}>New Numbers</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
