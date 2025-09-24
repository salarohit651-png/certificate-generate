import { notFound } from 'next/navigation';
import User from '@/models/User';
import Image from 'next/image';
import { decodeViewToken } from '@/lib/url-utils';

interface UserViewPageProps {
  params: {
    token: string;
  };
}

async function getUserByToken(token: string) {
  try {
    const registrationNumber = await decodeViewToken(token);
    if (!registrationNumber) {
      return null;
    }

    const user = await User.findOne({ registrationNumber }).select(
      '-hashedPassword'
    );
    return user;
  } catch (e) {
    console.error('Error fetching user:', e);
    return null;
  }
}

export default async function UserViewPage({ params }: UserViewPageProps) {
  const user = await getUserByToken(params.token);
  if (!user) {
    notFound();
  }

  const personalInfo = [
    { label: 'Full Name', value: user.name },
    { label: 'Father/Husband Name', value: user.fatherHusbandName },
    { label: 'Mobile Number', value: user.mobileNo },
    { label: 'Email Address', value: user.emailId },
    {
      label: 'Date of Birth',
      value: new Date(user.dateOfBirth).toLocaleDateString(),
    },
    { label: 'State', value: user.state },
    { label: 'Address', value: user.address },
  ];

  const educationalInfo = [
    { label: 'Course Name', value: user.courseName || 'Staff Nursing' },
    { label: 'Experience', value: user.experience || 'N/A' },
    { label: 'College Name', value: user.collegeName || 'N/A' },
  ];

  return (
    <div className="min-h-screen bg-[#89a9c2] flex items-center justify-center overflow-auto p-4">
      {/* Fixed PDF container */}
      <div className="relative bg-[#e6eef0] rounded-md p-6 sm:w-[794px] sm:min-h-[1123px] w-full shadow-[18px_11px_4px_0px_#3333332e]">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="sm:w-[350px] w-[200px] rounded-full border-4 border-gray-300 flex items-center justify-center opacity-10">
            <img src="/images/WaterMark.svg" />
          </div>
        </div>

        {/* Certificate Content */}
        <div className="border-2 rounded-md border-gray-400 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 gap-6">
            <div className="flex items-center space-x-4 emblem-dark-logo">
              <img alt="Logo" src="/images/emblem-dark.png" />
              <div className="text-left">
                <div className="text-xs font-bold text-gray-800 mb-1">
                  स्वास्थ्य एवं परिवार कल्याण मंत्रालय
                </div>
                <div className="text-sm font-bold text-gray-800 mb-1">
                  MINISTRY OF HEALTH &amp; FAMILY WELFARE
                </div>
                <div className="text-xs font-bold text-gray-800 mb-1">
                  स्वास्थ्य एवं परिवार कल्याण विभाग
                </div>
                <div className="text-xs font-bold text-gray-800">
                  DEPARTMENT OF HEALTH &amp; FAMILY WELFARE
                </div>
              </div>
            </div>
            <img
              src="/images/esanjeevani.png"
              alt="Family Welfare"
              className="object-contain sm:w-[200px] w-[80px]"
            />
          </div>

          {/* Title */}
          <div className="bg-[#476890] p-1.5 text-white max-w-[500px] mb-8 rounded mx-auto">
            <h1 className="text-center font-semibold sm:text-xl text-sm">
              {user.registrationFormTitle}
            </h1>
          </div>

          {/* Registration & Photo */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h5 className="uppercase text-md font-semibold mb-5">
                registration number: {user.registrationNumber}
              </h5>
              <h5 className="normal-case font-semibold mb-5">
                {new Date(user.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h5>
            </div>
            <div className="flex-shrink-0 shadow-sm border border-gray-300">
              <Image
                src={user.photoUrl || '/placeholder.svg'}
                alt={user.name}
                width={100}
                height={100}
                className="sm:w-[100px] sm:h-[100px] w-[75px] h-[75px] object-cover"
              />
            </div>
          </div>

          {/* Personal + Educational Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {personalInfo.map((info) => (
              <div key={info.label} className="flex flex-col">
                <h3 className="font-bold text-sm">{info.label}:</h3>
                <p className="text-base">{info.value}</p>
              </div>
            ))}
            {educationalInfo.map((info) => (
              <div key={info.label} className="flex flex-col">
                <h3 className="font-bold text-sm">{info.label}:</h3>
                <p className="text-base">{info.value}</p>
              </div>
            ))}
          </div>

          {/* Signature & QR */}
          <div className="flex justify-between flex-nowrap items-center mt-8">
            <div className="flex flex-col gap-5 w-full">
              <div className="flex flex-col w-fit sm:w-full">
                <img
                  src="/images/signature.png"
                  alt="Signature"
                  className="sm:w-[200px] w-[125px] object-contain bg-transparent mix-blend-multiply"
                />
                <p className="font-bold text-gray-700 mt-2 text-sm uppercase">
                  signature
                </p>
                <p className="font-bold text-gray-700 mt-2 text-sm uppercase">
                  mr. ramesh kumar
                </p>
              </div>
              <div className="flex gap-4">
                <img
                  src="/images/iyceng.png"
                  className="sm:w-[120px] sm:h-[100px] w-[50px]"
                />
                <img
                  src="/images/swach-bharat.png"
                  className="sm:w-[120px] sm:h-[100px] w-[50px]"
                />
                <img
                  src="/images/esanjeevani.png"
                  className="sm:w-[120px] sm:h-[100px] w-[50px]"
                />
              </div>
            </div>
            <div className="flex gap-4">
              {user.qrCodeUrl && (
                <div className="text-center">
                  <img
                    src={user.qrCodeUrl}
                    alt="QR Code"
                    className="sm:w-[150px] w-[100px]"
                  />
                  <p className="text-xs text-gray-600 mt-2 font-bold">
                    Scan to Verify
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Marquee */}
          <div className="overflow-hidden whitespace-nowrap border border-gray-300 p-2 mt-8">
            <span className="scroll-marquee cursor-pointer font-bold text-gray-800">
              Your registration completed with 1250/- rupee
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
