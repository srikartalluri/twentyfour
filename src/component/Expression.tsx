import React from "react";
import {DoublyLinkedList} from 'doubly-linked-list-typed';

type ExpressionProps = {
  expressionList: DoublyLinkedList;
};

const Expression = ({
    expressionList
}: ExpressionProps) => {


    let arr = expressionList.toArray();  

  return (

    <div className="rounded-lg text-center overflow-hidden shadow-lg bg-[#9F9F9F] w-full">
    <div className="px-10 py-2">
      <div className="flex justify-center">
        
        {arr.map((item, index) => (
        <div key={index} className = "text-7xl mb-2 w-1/20 p-3">{item}</div> 
      ))}



      </div>
    </div>
  </div>

  );
};

export default Expression;
