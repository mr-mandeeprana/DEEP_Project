import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Share,
  Award,
  Calendar,
  User,
  BookOpen,
  Star,
  CheckCircle,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  course_title: string;
  instructor_name: string;
  learner_name: string;
  completion_date: string;
  course_duration: number;
  difficulty_level: string;
  verification_url: string;
  download_count?: number;
}

interface CertificateGeneratorProps {
  enrollmentId?: string;
  courseData?: {
    title: string;
    instructor_name: string;
    duration_hours: number;
    difficulty_level: string;
  };
  learnerName?: string;
  isPreview?: boolean;
}

export const CertificateGenerator = ({
  enrollmentId,
  courseData,
  learnerName = "John Doe",
  isPreview = false
}: CertificateGeneratorProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateCertificate = async () => {
    if (!enrollmentId || !courseData) return;

    setIsGenerating(true);
    try {
      // Call the database function to generate certificate
      const { data, error } = await supabase.rpc('generate_certificate', {
        p_enrollment_id: enrollmentId
      });

      if (error) throw error;

      // Fetch the created certificate
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .single();

      if (certError) throw certError;

      setCertificate(certData);
      setShowPreview(true);

      toast({
        title: "Certificate Generated!",
        description: "Your completion certificate is ready.",
      });

    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificate || !canvasRef.current) return;

    try {
      // Generate certificate image using canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Create certificate design
      drawCertificate(ctx, certificate);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `certificate-${certificate.certificate_number}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Update download count
          supabase
            .from('certificates')
            .update({
              download_count: certificate.download_count + 1,
              last_downloaded_at: new Date().toISOString()
            })
            .eq('id', certificate.id);

          toast({
            title: "Download Complete",
            description: "Certificate downloaded successfully!",
          });
        }
      });

    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast({
        title: "Download Failed",
        description: "Could not download certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const drawCertificate = (ctx: CanvasRenderingContext2D, cert: Certificate) => {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // Inner border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 540);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', 400, 100);

    // Subtitle
    ctx.font = 'italic 18px serif';
    ctx.fillText('This certifies that', 400, 140);

    // Learner name
    ctx.font = 'bold 28px serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(cert.learner_name.toUpperCase(), 400, 180);

    // Completion text
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px serif';
    ctx.fillText('has successfully completed the course', 400, 220);

    // Course title
    ctx.font = 'bold 24px serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`"${cert.course_title}"`, 400, 260);

    // Instructor
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px serif';
    ctx.fillText(`Instructor: ${cert.instructor_name}`, 400, 300);

    // Details
    ctx.font = '14px serif';
    ctx.fillText(`Duration: ${cert.course_duration} hours`, 250, 340);
    ctx.fillText(`Difficulty: ${cert.difficulty_level}`, 550, 340);
    ctx.fillText(`Completion Date: ${format(new Date(cert.completion_date), 'MMMM dd, yyyy')}`, 400, 370);

    // Certificate number
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Certificate #: ${cert.certificate_number}`, 400, 420);

    // Verification URL
    ctx.font = '10px monospace';
    ctx.fillText(`Verify at: ${cert.verification_url}`, 400, 440);

    // Signature line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(600, 480);
    ctx.lineTo(750, 480);
    ctx.stroke();

    ctx.font = '12px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Instructor Signature', 675, 500);

    // Award icon
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px serif';
    ctx.fillText('🏆', 100, 500);
  };

  const shareCertificate = async () => {
    if (!certificate) return;

    const shareData = {
      title: 'Course Completion Certificate',
      text: `I completed the "${certificate.course_title}" course! Check out my certificate.`,
      url: certificate.verification_url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast({
          title: "Copied to clipboard",
          description: "Share link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (isPreview) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Certificate Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 text-center border-2 border-dashed border-blue-200">
              <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Certificate of Completion</h3>
              <p className="text-muted-foreground mb-4">
                This course offers a certificate upon completion
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Course:</strong> {courseData?.title}
                </div>
                <div>
                  <strong>Instructor:</strong> {courseData?.instructor_name}
                </div>
                <div>
                  <strong>Duration:</strong> {courseData?.duration_hours} hours
                </div>
                <div>
                  <strong>Difficulty:</strong> {courseData?.difficulty_level}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Certificate Display */}
      {certificate && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Your Certificate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Certificate Preview Canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
              style={{ display: 'none' }}
            />

            {/* Certificate Info */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{certificate.course_title}</h3>
                    <p className="text-muted-foreground">Completed by {certificate.learner_name}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Issued: {format(new Date(certificate.issued_at), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm">
                        Instructor: {certificate.instructor_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm">
                        Duration: {certificate.course_duration} hours
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Badge className="mb-2">{certificate.certificate_number}</Badge>
                    <p className="text-sm text-muted-foreground">
                      Downloads: {certificate.download_count}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={downloadCertificate} className="flex-1 gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <Button onClick={shareCertificate} variant="outline" className="flex-1 gap-2">
                      <Share className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Certificate Button */}
      {!certificate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Certificate of Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Congratulations!</h3>
                <p className="text-muted-foreground">
                  You have successfully completed this course and are eligible for a certificate.
                </p>
              </div>

              <Button
                onClick={generateCertificate}
                disabled={isGenerating}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Award className="w-5 h-5" />
                    Generate Certificate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for certificate generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};