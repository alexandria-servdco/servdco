interface ReviewCardProps {
  quote: string;
  author: string;
  title: string;
  image?: string;
}

export default function ReviewCard({ quote, author, title, image }: ReviewCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow">
      <p className="text-foreground text-base leading-relaxed mb-8 text-lg">{quote}</p>
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        {image && (
          <img
            src={image}
            alt={author}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div>
          <p className="font-semibold text-foreground text-base">{author}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
    </div>
  );
}
