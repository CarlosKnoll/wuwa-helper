import { Star } from 'lucide-react';
import { StarRatingProps } from '../../props';


export default function StarRating({
  stars,
  maxStars = 3,
  onChange,
  disabled = false,
  size = 'md',
  activeColor = 'text-yellow-400',
  inactiveColor = 'text-slate-600',
}: StarRatingProps) {
  const sizeClasses: Record<string, string> = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeClasses[size];
  const isEditable = onChange && !disabled;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= stars;

        if (isEditable) {
          return (
            <button
              key={i}
              onClick={() => onChange(starValue === stars ? 0 : starValue)}
              className={`${isFilled ? activeColor : inactiveColor} hover:scale-110 transition-transform`}
              title={`${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              <Star className={starSize} fill={isFilled ? 'currentColor' : 'none'} />
            </button>
          );
        }

        return (
          <Star
            key={i}
            className={`${starSize} ${isFilled ? activeColor : inactiveColor}`}
            fill={isFilled ? 'currentColor' : 'none'}
          />
        );
      })}
    </div>
  );
}