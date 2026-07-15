package com.einblick.backend;// 간단 테스트용 - PDFBox로 PO PDF에서 텍스트가 실제로 어떻게 추출되는지 확인
// 실행: 이 파일 하나만 backend 프로젝트 루트에서 임시로 돌려보고 결과 공유해주세요.
//
// build.gradle에 임시로 추가:
//   implementation 'org.apache.pdfbox:pdfbox:3.0.3'
//
// 실행 방법 (backend 폴더에서):
//   javac -cp "$(find ~/.gradle -name 'pdfbox-3.0.3.jar' | head -1)" com.einblick.einblick.PdfExtractTest.java -d /tmp
//   java -cp "/tmp:$(find ~/.gradle -name '*.jar' | tr '\n' ':')" com.einblick.einblick.PdfExtractTest OS_MassPrint_ProdOrder - 202601191920398075.pdf
//
// (귀찮으면 그냥 컨트롤러 하나 임시로 만들어서 이 로직 넣고 웹에서 호출해도 됨)

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;

public class PdfExtractTest {
    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.out.println("사용법: java PdfExtractTest <PDF경로>");
            return;
        }
        try (PDDocument doc = Loader.loadPDF(new File(args[0]))) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(doc);

            System.out.println("========== 추출된 텍스트 (SortByPosition=true) ==========");
            System.out.println(text);

            System.out.println("\n\n========== 추출된 텍스트 (SortByPosition=false, 원본 순서) ==========");
            PDFTextStripper stripper2 = new PDFTextStripper();
            stripper2.setSortByPosition(false);
            System.out.println(stripper2.getText(doc));
        }
    }
}

