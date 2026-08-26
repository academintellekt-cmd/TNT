#include <Adafruit_NeoPixel.h>
const uint8_t PINS[4]={2,3,4,5};
const uint16_t LEDS_PER_LINE=30;
Adafruit_NeoPixel strips[4]={
  Adafruit_NeoPixel(LEDS_PER_LINE,PINS[0],NEO_GRB+NEO_KHZ800),
  Adafruit_NeoPixel(LEDS_PER_LINE,PINS[1],NEO_GRB+NEO_KHZ800),
  Adafruit_NeoPixel(LEDS_PER_LINE,PINS[2],NEO_GRB+NEO_KHZ800),
  Adafruit_NeoPixel(LEDS_PER_LINE,PINS[3],NEO_GRB+NEO_KHZ800)};
String line;
void fillLine(uint8_t n,uint32_t c){for(uint16_t i=0;i<LEDS_PER_LINE;i++)strips[n].setPixelColor(i,c);strips[n].show();}
void allOff(){for(uint8_t n=0;n<4;n++)fillLine(n,0);}
void idle(){for(uint8_t n=0;n<4;n++)fillLine(n,n<2?strips[n].Color(0,18,55):strips[n].Color(55,18,0));}
void flashPlayer(uint8_t p){uint8_t first=p?2:0;for(uint8_t k=0;k<2;k++){for(uint8_t n=first;n<first+2;n++)fillLine(n,strips[n].Color(255,255,255));delay(70);for(uint8_t n=first;n<first+2;n++)fillLine(n,0);delay(45);}}
void command(String s){s.trim();if(s=="HELLO"){Serial.println("TNT_LED READY");return;}if(s=="MODE IDLE"||s=="MODE READY"){idle();Serial.println("ACK "+s);return;}if(s.startsWith("MODE COUNTDOWN")){allOff();return;}if(s.startsWith("MODE GAME")){allOff();return;}if(s=="PRESS P1"){flashPlayer(0);return;}if(s=="PRESS P2"){flashPlayer(1);return;}if(s.startsWith("RESULT")){idle();return;}Serial.println("ERR UNKNOWN");}
void setup(){Serial.begin(115200);for(uint8_t n=0;n<4;n++){strips[n].begin();strips[n].setBrightness(80);strips[n].show();}idle();Serial.println("TNT_LED READY");}
void loop(){while(Serial.available()){char c=Serial.read();if(c=='\n'){command(line);line="";}else if(c!='\r'&&line.length()<96)line+=c;}}
