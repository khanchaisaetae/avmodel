# Dell G7 7588: official port evidence supplement

Reviewed: 2026-10-23 (Asia/Bangkok).
Purpose: user-authorized supplement to the supplied Dell screenshot. This file is a review summary with source URLs, not a downloaded copy of Dell's manual.

## Model-specific manual: Right

Dell G7 15 7588 Setup and Specifications, Views > Right, items 3 and 4:
https://www.dell.com/support/manuals/en-us/g-series-15-7588-laptop/g7-7588-setupandspecs/right?guid=guid-ebc6a569-b280-494d-a638-06234dcc596d&lang=en-us

- Right-side Type-C port: Thunderbolt 3, USB 3.1 Gen 2 and DisplayPort 1.2. Dell explicitly describes external-display use through an appropriate adapter.
- The HDMI port is an output for video and audio to a compatible display.
- The absence of a dedicated full-size DisplayPort connector does not mean that DisplayPort video over Type-C is unsupported.

## General DisplayPort-over-USB-C guidance

Dell article 000141328, supplied by the user:
https://www.dell.com/support/kbdoc/en-th/000141328/displayport-over-usb-type-c

DisplayPort Alt Mode carries display audio/video using the USB-C connector. A USB-C-shaped connector or a charging/data-only cable alone does not establish video support. Use the model-specific manual above for this laptop's capability; do not apply generic article maximum resolutions or power-delivery figures as G7 7588 specifications.

## Connection guidance

Dell connection guide, supplied by the user:
https://www.dell.com/support/contents/en-th/article/product-support/self-support-knowledgebase/monitor-screen-video/connect-laptop-to-display

Conditional paths for the learning application:

1. USB-C to a display's USB-C input: display input and cable must support DisplayPort video over USB-C.
2. USB-C to DisplayPort: use a compatible USB-C/DisplayPort cable or adapter in the laptop-to-display direction.
3. USB-C to HDMI: use a compatible DisplayPort-over-USB-C to HDMI cable/adapter. Treat the HDMI conversion explicitly; a USB data cable is not equivalent.

These sources do not establish an exact tested resolution/refresh-rate matrix for every adapter, nor that this laptop accepts charging through Type-C. Those properties remain unknown in the catalog. Logical port confirmation also does not calibrate its glTF click position.
