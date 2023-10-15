import React from "react";
import Card from './Card';


type CardDisplayProps = {
  nums: number[];
};

const CardDisplay = ({
  nums
}: CardDisplayProps) => {
  return (

      <div className="grid-container grid grid-cols-2 grid-rows-2">


        {nums.map((item, index) => (
        <div key={index} className="p-5">

          <Card num = {item}/>
        
        {/* Render the content of the grid item */}
        </div> 
      ))}


      </div>

  );
};

export default CardDisplay;
