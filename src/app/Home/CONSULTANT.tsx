import Image from 'next/image';

export default function ConsultantPoster() {
  return (
    <section className="w-full flex justify-center items-center">
      <div className="w-full max-w-screen-2xl">
        <Image
          src="/imges/banner4.png"
          alt="Consultant Poster"
          width={1920}
          height={1080}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </section>
  );
}