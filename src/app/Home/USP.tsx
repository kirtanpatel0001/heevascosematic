import Image from 'next/image';

export default function UspBanner() {
  return (
    <section className="w-full bg-[#EAF5FC] flex justify-center items-center">
      <div className="w-full max-w-screen-2xl">
        <Image
          src="/imges/banner2.png"
          alt="Our Stats and USP"
          width={1920}
          height={960}
          className="w-full h-auto object-contain"
          priority
        />
      </div>
    </section>
  );
}