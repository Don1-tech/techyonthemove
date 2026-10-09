import styles from "../../sections/services/services.module.css";

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  className?: string;
}

export default function ServiceCard({
  title,
  description,
  image,
  imageAlt,
  className = "",
}: ServiceCardProps) {
  return (
    <article className={`${styles.card} ${className}`}>
      <img
        src={image}
        alt={imageAlt}
        className={styles.image}
      />

      <div className={styles.text}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}