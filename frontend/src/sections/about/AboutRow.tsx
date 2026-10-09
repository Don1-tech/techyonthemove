
import styles from "./about.module.css";

interface AboutRowProps {
  image: string;
  imageAlt: string;
  points: string[];
  label?: string;
  imagePosition: "left" | "right";
}

export default function AboutRow({
  image,
  imageAlt,
  points,
  label,
  imagePosition,
}: AboutRowProps) {
  const imageElement = (
    <div className={styles.imageCard}>
      <img src={image} alt={imageAlt} className={styles.image} />
    </div>
  );

  const textElement = (
    <div className={styles.textCard}>
      {label && <h3 className={styles.label}>{label}</h3>}

      <ul className={styles.points}>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`${styles.row} ${styles[imagePosition]}`}>
      {imagePosition === "left" ? (
        <>
          {imageElement}
          {textElement}
        </>
      ) : (
        <>
          {textElement}
          {imageElement}
        </>
      )}
    </div>
  );
};