type CardProps = {
    num: number;
  }
  
  const Card = ({ num }: CardProps) => {
    return (
        <div className="max-w-sm rounded-lg overflow-hidden shadow-lg bg-[#9F9F9F] w-64 overflow-x-auto">
        <div className="px-10 py-2">
          <div className="text-huge mb-2">{num}</div>
        </div>
      </div>
    )
  }
  
  export default Card