import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
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
      console.log('[v0] Invalid, expired, or already used token');
      return null;
    }

    const user = await User.findOne({ registrationNumber }).select(
      '-hashedPassword'
    );
    if (!user) {
      console.log(
        '[v0] User not found for registration number:',
        registrationNumber
      );
    }
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
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
    {
      label: 'Registration Number',
      value: user.registrationNumber,
    },
    {
      label: 'Last Updated',
      value: new Date(user.updatedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  return (
    <div className="relative">
      {/* Stamp / watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-gray-300 flex items-center justify-center opacity-20 rotate-12">
          <span className="text-gray-400 font-bold text-center text-lg sm:text-2xl">
            HEALTH AND WELFARE MINISTRY
          </span>
        </div>
      </div>
      <div className="min-h-screen flex items-center justify-center w-full">
        <div className="max-w-[35%] w-full mx-auto">
          <div className="bg-card text-card-foreground flex flex-col gap-6 shadow-lg">
            <div className="border border-gray-300 m-4 p-4">
              <div className="flex flex-col md:flex-row items-center justify-between w-full mb-8 gap-6">
                <div className="flex items-center space-x-4 xl:space-x-6">
                  <img alt="Increase font size" src="/images/emblem-dark.png" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-gray-800 mb-1">
                      स्वास्थ्य एवं परिवार कल्याण मंत्रालय
                    </div>
                    <div className="text-sm xl:text-base font-bold text-gray-800 mb-1">
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
                  className="object-contain sm:w-auto sm:h-auto md:max-w-[200px] max-w-[200px]"
                />
              </div>
              <div className="certificate-title bg-gray-100 text-gray-800 p-2.5 max-w-[500px] rounded my-8 mx-auto">
                <h1 className="text-center font-semibold text-base sm:text-lg md:text-xl lg:text-2xl">
                  Staff Nursing Registration Letter
                </h1>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <div className="flex gap-4">
                    <div>
                      {personalInfo.map((info) => (
                        <div key={info.label} className="flex flex-col gap-1">
                          <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-600">
                            {info.label}:
                          </h3>
                          <p className="text-sm sm:text-base md:text-lg">
                            {info.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div>
                      {educationalInfo.map((info) => (
                        <div key={info.label} className="flex flex-col gap-1">
                          <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-600">
                            {info.label}:
                          </h3>
                          <p className="text-sm sm:text-base md:text-lg">
                            {info.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6 sm:mb-0 flex justify-start">
                  <div className="bg-white flex-col flex justify-center items-center max-w-[250px] sm:max-w-[300px]">
                    <Image
                      src="/images/signature.png"
                      alt="Signature"
                      width={300}
                      height={120}
                      className="w-[200px] sm:w-[280px] h-auto object-contain"
                    />
                    <p className="font-bold text-sm sm:text-base mt-2 text-gray-700">
                      Authorized Signature
                    </p>
                  </div>
                </div>
                <div className="flex gap-8 lg:justify-end flex-wrap">
                  <div className="bg-white p-1 flex items-center">
                    <Image
                      src="/images/swachBharat.png"
                      alt="QR Code"
                      width={200}
                      height={120}
                    />
                  </div>
                  <div className="bg-white p-1 flex items-center">
                    <Image
                      src="/images/iyceng.png"
                      alt="QR Code"
                      width={150}
                      height={120}
                    />
                  </div>
                  {user.qrCodeUrl && (
                    <div>
                      <div className="bg-white p-1 pl-4 text-center">
                        <Image
                          src={user.qrCodeUrl || '/placeholder.svg'}
                          alt="QR Code"
                          width={120}
                          height={120}
                        />
                        <p className="text-xs text-gray-600 mt-2 font-bold">
                          Scan to Verify
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
